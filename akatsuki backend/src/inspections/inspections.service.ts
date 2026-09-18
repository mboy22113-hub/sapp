/**
 * ===== inspections.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Orchestrates the full lifecycle of an inspection:
 * 1. Creation (DRAFT status)
 * 2. Answering questions (transitions to IN_PROGRESS, records PASS/FAIL/NA)
 * 3. Completion (transitions to COMPLETED, records completed_at timestamp)
 *
 * IMPORTANT FUNCTIONS:
 * - createInspection()      → Starts a new inspection session.
 * - findAllInspections()    → Lists inspections (scoped to caller's role).
 * - findInspectionById()    → Retrieves detailed inspection record with responses.
 * - updateInspection()      → Updates inspection header details.
 * - submitResponse()        → Submits/upserts answer for a checklist question.
 * - completeInspection()    → Finalizes inspection and locks it.
 * - getResponses()          → Retrieves all answered items with question text.
 *
 * DATA FLOW:
 * Inspector creates inspection
 *   ↓
 * Inspector submits responses (status transitions to IN_PROGRESS)
 *   ↓
 * Any FAIL response can trigger creation of a Finding (Phase 6)
 *   ↓
 * Inspector marks inspection COMPLETED
 *
 * WHERE TO MODIFY LATER:
 * - Add automated calculation of overall compliance score upon completion.
 * - Send notification when an inspection is completed.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { InspectionStatus } from '../common/enums/inspection-status.enum';

@Injectable()
export class InspectionsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create a new inspection in DRAFT status.
   */
  async createInspection(inspectorId: string, dto: CreateInspectionDto) {
    const supabase = this.supabaseService.getClient();

    // Verify checklist exists
    const { data: checklist, error: checklistErr } = await supabase
      .from('checklists')
      .select('id')
      .eq('id', dto.checklist_id)
      .single();

    if (checklistErr || !checklist) {
      throw new NotFoundException(`Checklist with ID ${dto.checklist_id} not found.`);
    }

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        site_name: dto.site_name,
        department: dto.department || null,
        checklist_id: dto.checklist_id,
        inspector_id: inspectorId,
        status: InspectionStatus.DRAFT,
      })
      .select(`
        *,
        checklist:checklists(id, name),
        inspector:profiles(id, full_name, email)
      `)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create inspection: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * List inspections. Admins and Safety Officers see all. Inspectors see their own.
   */
  async findAllInspections(user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('inspections')
      .select(`
        id,
        site_name,
        department,
        status,
        started_at,
        completed_at,
        created_at,
        checklist:checklists(id, name),
        inspector:profiles(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Restrict inspectors to their own inspections
    if (user.role === Role.INSPECTOR) {
      query = query.eq('inspector_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch inspections: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Retrieve a single inspection with checklist and all responses.
   */
  async findInspectionById(id: string, user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    const { data: inspection, error } = await supabase
      .from('inspections')
      .select(`
        *,
        checklist:checklists(id, name, description),
        inspector:profiles(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !inspection) {
      throw new NotFoundException(`Inspection with ID ${id} not found.`);
    }

    // Role access check
    if (user.role === Role.INSPECTOR && inspection.inspector_id !== user.id) {
      throw new ForbiddenException('You can only view your own inspections.');
    }

    // Fetch responses for this inspection
    const { data: responses, error: respError } = await supabase
      .from('inspection_responses')
      .select(`
        id,
        answer,
        observation,
        created_at,
        updated_at,
        item:checklist_items(id, question, description, category, sort_order)
      `)
      .eq('inspection_id', id)
      .order('created_at', { ascending: true });

    if (respError) {
      throw new InternalServerErrorException(
        `Failed to fetch responses: ${respError.message}`,
      );
    }

    return {
      ...inspection,
      responses: responses || [],
    };
  }

  /**
   * Update inspection metadata.
   */
  async updateInspection(id: string, user: AuthUser, dto: UpdateInspectionDto) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findInspectionById(id, user);

    if (existing.status === InspectionStatus.COMPLETED && user.role !== Role.ADMIN) {
      throw new BadRequestException(
        'Cannot modify an inspection that has already been completed.',
      );
    }

    const updatePayload: Record<string, any> = {};
    if (dto.site_name !== undefined) updatePayload.site_name = dto.site_name;
    if (dto.department !== undefined) updatePayload.department = dto.department;
    if (dto.status !== undefined) updatePayload.status = dto.status;

    const { data, error } = await supabase
      .from('inspections')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update inspection: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Submit an answer for a checklist question.
   * Automatically advances DRAFT → IN_PROGRESS if first response.
   */
  async submitResponse(inspectionId: string, user: AuthUser, dto: SubmitResponseDto) {
    const supabase = this.supabaseService.getClient();

    const inspection = await this.findInspectionById(inspectionId, user);

    if (inspection.status === InspectionStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot submit responses to a completed inspection.',
      );
    }

    // Advance status to IN_PROGRESS if currently DRAFT
    if (inspection.status === InspectionStatus.DRAFT) {
      await supabase
        .from('inspections')
        .update({
          status: InspectionStatus.IN_PROGRESS,
          started_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);
    }

    // Upsert response (using unique index on inspection_id, checklist_item_id)
    const { data, error } = await supabase
      .from('inspection_responses')
      .upsert(
        {
          inspection_id: inspectionId,
          checklist_item_id: dto.checklist_item_id,
          answer: dto.answer,
          observation: dto.observation || null,
        },
        { onConflict: 'inspection_id,checklist_item_id' },
      )
      .select(`
        *,
        item:checklist_items(id, question, category)
      `)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to save response: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Update an existing response observation or answer.
   */
  async updateResponse(responseId: string, user: AuthUser, dto: UpdateResponseDto) {
    const supabase = this.supabaseService.getClient();

    // Verify response exists
    const { data: response, error: getErr } = await supabase
      .from('inspection_responses')
      .select('inspection_id')
      .eq('id', responseId)
      .single();

    if (getErr || !response) {
      throw new NotFoundException(`Response with ID ${responseId} not found.`);
    }

    // Verify access to parent inspection
    await this.findInspectionById(response.inspection_id, user);

    const updatePayload: Record<string, any> = {};
    if (dto.answer !== undefined) updatePayload.answer = dto.answer;
    if (dto.observation !== undefined) updatePayload.observation = dto.observation;

    const { data, error } = await supabase
      .from('inspection_responses')
      .update(updatePayload)
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update response: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Mark inspection as COMPLETED.
   */
  async completeInspection(id: string, user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    const inspection = await this.findInspectionById(id, user);

    if (inspection.status === InspectionStatus.COMPLETED) {
      throw new BadRequestException('Inspection is already completed.');
    }

    if (!inspection.responses || inspection.responses.length === 0) {
      throw new BadRequestException(
        'Cannot complete an inspection with no recorded responses.',
      );
    }

    const { data, error } = await supabase
      .from('inspections')
      .update({
        status: InspectionStatus.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to complete inspection: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Get all responses for an inspection.
   */
  async getResponses(inspectionId: string, user: AuthUser) {
    const inspection = await this.findInspectionById(inspectionId, user);
    return inspection.responses || [];
  }
}
