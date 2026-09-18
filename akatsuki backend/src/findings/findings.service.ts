/**
 * ===== findings.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Encapsulates business logic and persistence for safety findings.
 * It enforces that risk_score and risk_level are ALWAYS calculated by the backend.
 *
 * IMPORTANT FUNCTIONS:
 * - createFinding()   → Validates inspection, calculates risk score & level, saves finding.
 * - findAllFindings() → Returns findings list (filtered by role and optional query filters).
 * - findFindingById() → Returns detailed finding with related inspection and evidence.
 * - updateFinding()   → Recalculates risk if likelihood/severity change, updates status.
 *
 * DATA FLOW:
 * Inspector creates finding with likelihood & severity
 *   ↓
 * Backend computes risk_score = likelihood * severity
 * Backend determines risk_level (LOW, MEDIUM, HIGH, CRITICAL)
 *   ↓
 * Stored in `findings` table
 *   ↓
 * Later in Phase 7 & 8: Evidence and Corrective Actions link to this finding
 *
 * WHERE TO MODIFY LATER:
 * - Trigger email/Slack alerts when a CRITICAL risk finding is created.
 */

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { calculateRiskLevel, calculateRiskScore } from '../common/utils/risk.util';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { FindingStatus } from '../common/enums/finding-status.enum';
import { RiskLevel } from '../common/enums/risk-level.enum';

@Injectable()
export class FindingsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create a new finding with calculated risk metrics.
   */
  async createFinding(userId: string, dto: CreateFindingDto) {
    const supabase = this.supabaseService.getClient();

    // Verify parent inspection exists
    const { data: inspection, error: inspErr } = await supabase
      .from('inspections')
      .select('id, site_name')
      .eq('id', dto.inspection_id)
      .single();

    if (inspErr || !inspection) {
      throw new NotFoundException(`Inspection ${dto.inspection_id} not found.`);
    }

    // Backend calculates risk score and level
    const riskScore = calculateRiskScore(dto.likelihood, dto.severity);
    const riskLevel = calculateRiskLevel(riskScore);

    const { data, error } = await supabase
      .from('findings')
      .insert({
        inspection_id: dto.inspection_id,
        title: dto.title,
        description: dto.description || null,
        likelihood: dto.likelihood,
        severity: dto.severity,
        risk_score: riskScore,
        risk_level: riskLevel,
        status: FindingStatus.OPEN,
        created_by: userId,
      })
      .select(`
        *,
        creator:profiles(id, full_name, email),
        inspection:inspections(id, site_name, department)
      `)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create finding: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * List findings with optional filtering.
   */
  async findAllFindings(
    user: AuthUser,
    filters?: {
      inspectionId?: string;
      status?: FindingStatus;
      riskLevel?: RiskLevel;
    },
  ) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('findings')
      .select(`
        id,
        title,
        description,
        likelihood,
        severity,
        risk_score,
        risk_level,
        status,
        created_at,
        inspection:inspections(id, site_name, department),
        creator:profiles(id, full_name, email)
      `)
      .order('risk_score', { ascending: false })
      .order('created_at', { ascending: false });

    // Inspectors only see their own findings
    if (user.role === Role.INSPECTOR) {
      query = query.eq('created_by', user.id);
    }

    if (filters?.inspectionId) {
      query = query.eq('inspection_id', filters.inspectionId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch findings: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Get single finding by ID with attached evidence and inspection.
   */
  async findFindingById(id: string, user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    const { data: finding, error } = await supabase
      .from('findings')
      .select(`
        *,
        creator:profiles(id, full_name, email),
        inspection:inspections(id, site_name, department, status, started_at, completed_at)
      `)
      .eq('id', id)
      .single();

    if (error || !finding) {
      throw new NotFoundException(`Finding with ID ${id} not found.`);
    }

    // Role check: inspectors can only view their own findings
    if (user.role === Role.INSPECTOR && finding.created_by !== user.id) {
      throw new ForbiddenException('You can only view findings you created.');
    }

    // Fetch related evidence if available
    const { data: evidence } = await supabase
      .from('evidence')
      .select('*')
      .eq('finding_id', id)
      .order('created_at', { ascending: false });

    // Fetch related corrective actions if available
    const { data: actions } = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('finding_id', id)
      .order('created_at', { ascending: false });

    return {
      ...finding,
      evidence: evidence || [],
      corrective_actions: actions || [],
    };
  }

  /**
   * Update finding properties and recalculate risk score if needed.
   */
  async updateFinding(id: string, user: AuthUser, dto: UpdateFindingDto) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findFindingById(id, user);

    const updatePayload: Record<string, any> = {};
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.status !== undefined) updatePayload.status = dto.status;

    // Recalculate risk if likelihood or severity changed
    const newLikelihood = dto.likelihood ?? existing.likelihood;
    const newSeverity = dto.severity ?? existing.severity;

    if (dto.likelihood !== undefined || dto.severity !== undefined) {
      const newScore = calculateRiskScore(newLikelihood, newSeverity);
      const newLevel = calculateRiskLevel(newScore);

      updatePayload.likelihood = newLikelihood;
      updatePayload.severity = newSeverity;
      updatePayload.risk_score = newScore;
      updatePayload.risk_level = newLevel;
    }

    const { data, error } = await supabase
      .from('findings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update finding: ${error.message}`,
      );
    }

    return data;
  }
}
