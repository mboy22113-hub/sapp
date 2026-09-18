/**
 * ===== evidence.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Manages evidence attachments (photos, PDFs) for safety findings.
 * It uses a 2-step direct-to-cloud upload pattern:
 * 1. Generates a short-lived signed upload URL for Supabase Storage.
 * 2. Client uploads file directly to Supabase Storage.
 * 3. Client notifies backend to persist file metadata in PostgreSQL.
 *
 * IMPORTANT FUNCTIONS:
 * - createUploadUrl()       → Generates secure presigned upload URL for frontend.
 * - saveEvidence()          → Saves file metadata (name, type, path) to PostgreSQL.
 * - getEvidenceForFinding() → Lists evidence and generates signed download/view URLs.
 * - deleteEvidence()        → Deletes both the storage file and database record.
 *
 * DATA FLOW:
 * Client requests upload URL for findingId
 *   ↓
 * EvidenceService requests signed URL from Supabase Storage bucket 'evidence'
 *   ↓
 * Client uploads binary directly to Supabase Storage
 *   ↓
 * Client calls saveEvidence() with storage_path
 *   ↓
 * Record saved in `evidence` table
 *
 * WHERE TO MODIFY LATER:
 * - Change bucket name or signed URL expiration times.
 * - Add thumbnail generation or virus scanning hooks.
 */

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { SaveEvidenceDto } from './dto/save-evidence.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

const BUCKET_NAME = 'evidence';

@Injectable()
export class EvidenceService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Generates a signed upload URL so the client can upload directly to Supabase Storage.
   */
  async createUploadUrl(
    findingId: string,
    user: AuthUser,
    dto: CreateUploadUrlDto,
  ) {
    const supabase = this.supabaseService.getClient();

    // Verify finding exists and user has access
    const { data: finding, error: findingErr } = await supabase
      .from('findings')
      .select('id, created_by')
      .eq('id', findingId)
      .single();

    if (findingErr || !finding) {
      throw new NotFoundException(`Finding ${findingId} not found.`);
    }

    if (user.role === Role.INSPECTOR && finding.created_by !== user.id) {
      throw new ForbiddenException('You can only attach evidence to your own findings.');
    }

    // Clean file name
    const sanitizedFileName = dto.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `findings/${findingId}/${Date.now()}_${sanitizedFileName}`;

    // Request signed upload URL from Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to generate upload URL: ${error.message}. Ensure bucket "${BUCKET_NAME}" exists in Supabase Storage.`,
      );
    }

    return {
      upload_url: data.signedUrl,
      token: data.token,
      storage_path: storagePath,
    };
  }

  /**
   * Save uploaded file metadata to the database.
   */
  async saveEvidence(findingId: string, user: AuthUser, dto: SaveEvidenceDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('evidence')
      .insert({
        finding_id: findingId,
        file_name: dto.file_name,
        file_type: dto.file_type,
        file_size: dto.file_size,
        storage_path: dto.storage_path,
        uploaded_by: user.id,
      })
      .select(`
        *,
        uploader:profiles(id, full_name, email)
      `)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to save evidence metadata: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * List all evidence for a finding, including signed view/download URLs.
   */
  async getEvidenceForFinding(findingId: string, user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    const { data: evidenceList, error } = await supabase
      .from('evidence')
      .select(`
        *,
        uploader:profiles(id, full_name, email)
      `)
      .eq('finding_id', findingId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch evidence: ${error.message}`,
      );
    }

    // Generate signed download URLs (valid for 1 hour = 3600 seconds)
    const enrichedList = await Promise.all(
      (evidenceList || []).map(async (item) => {
        const { data: signedData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(item.storage_path, 3600);

        return {
          ...item,
          download_url: signedData?.signedUrl || null,
        };
      }),
    );

    return enrichedList;
  }

  /**
   * Delete an evidence record and its file from Supabase Storage.
   */
  async deleteEvidence(evidenceId: string, user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    const { data: item, error: getErr } = await supabase
      .from('evidence')
      .select('id, storage_path, uploaded_by')
      .eq('id', evidenceId)
      .single();

    if (getErr || !item) {
      throw new NotFoundException(`Evidence item ${evidenceId} not found.`);
    }

    if (user.role !== Role.ADMIN && item.uploaded_by !== user.id) {
      throw new ForbiddenException('You can only delete evidence you uploaded.');
    }

    // Delete file from Supabase Storage
    await supabase.storage.from(BUCKET_NAME).remove([item.storage_path]);

    // Delete row from PostgreSQL
    const { error: delErr } = await supabase
      .from('evidence')
      .delete()
      .eq('id', evidenceId);

    if (delErr) {
      throw new InternalServerErrorException(
        `Failed to delete evidence: ${delErr.message}`,
      );
    }

    return { message: `Evidence ${evidenceId} successfully deleted.` };
  }
}
