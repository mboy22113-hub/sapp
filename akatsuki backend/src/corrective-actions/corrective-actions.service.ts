/**
 * ===== corrective-actions.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Enforces the strict compliance and resolution state machine:
 *
 *   OPEN ──(assigned)──► ASSIGNED ──(work started)──► IN_PROGRESS
 *                                                           │
 *                                                           ▼ (submit)
 *   IN_PROGRESS ◄────(REJECTED)────── PENDING_VERIFICATION
 *                                           │
 *                                           ▼ (APPROVED)
 *                                         CLOSED
 *
 * IMPORTANT FUNCTIONS:
 * - createAction()           → Creates action, links to finding.
 * - findAllActions()         → Returns list filtered by user role and query parameters.
 * - findActionById()         → Returns action with finding details and verification history.
 * - updateAction()           → Updates action details.
 * - submitForVerification()  → Called by Responsible Person when work is complete.
 * - verifyAction()           → Safety Officer approves/rejects and records verification.
 *
 * DATA FLOW:
 * Responsible Person finishes task → calls submitForVerification()
 *   ↓ Status becomes PENDING_VERIFICATION
 * Safety Officer inspects site → calls verifyAction()
 *   ├─ APPROVED → Status becomes CLOSED
 *   │            Checks if all actions for this finding are CLOSED → sets finding to RESOLVED
 *   └─ REJECTED → Status reverts to IN_PROGRESS
 *
 * WHERE TO MODIFY LATER:
 * - Add webhook or push notification when status reaches PENDING_VERIFICATION.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { VerifyActionDto } from './dto/verify-action.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { ActionStatus } from '../common/enums/action-status.enum';
import { VerificationResult } from '../common/enums/verification-result.enum';
import { FindingStatus } from '../common/enums/finding-status.enum';

@Injectable()
export class CorrectiveActionsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create a new corrective action for a finding.
   */
  async createAction(dto: CreateCorrectiveActionDto) {
    const supabase = this.supabaseService.getClient();

    // Verify finding exists
    const { data: finding, error: findingErr } = await supabase
      .from('findings')
      .select('id')
      .eq('id', dto.finding_id)
      .single();

    if (findingErr || !finding) {
      throw new NotFoundException(`Finding ${dto.finding_id} not found.`);
    }

    const initialStatus = dto.assigned_to ? ActionStatus.ASSIGNED : ActionStatus.OPEN;

    const { data, error } = await supabase
      .from('corrective_actions')
      .insert({
        finding_id: dto.finding_id,
        title: dto.title,
        description: dto.description || null,
        assigned_to: dto.assigned_to || null,
        due_date: dto.due_date || null,
        status: initialStatus,
      })
      .select(`
        *,
        assignee:profiles!assigned_to(id, full_name, email, department),
        finding:findings(id, title, risk_level, status)
      `)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create corrective action: ${error.message}`,
      );
    }

    // Set finding status to IN_PROGRESS if currently OPEN
    await supabase
      .from('findings')
      .update({ status: FindingStatus.IN_PROGRESS })
      .eq('id', dto.finding_id)
      .eq('status', FindingStatus.OPEN);

    return data;
  }

  /**
   * List corrective actions filtered by role and optional status/assignee.
   */
  async findAllActions(
    user: AuthUser,
    filters?: { findingId?: string; status?: ActionStatus; assignedTo?: string },
  ) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('corrective_actions')
      .select(`
        id,
        title,
        description,
        status,
        due_date,
        completed_at,
        created_at,
        finding:findings(id, title, risk_level, status),
        assignee:profiles!assigned_to(id, full_name, email, department)
      `)
      .order('created_at', { ascending: false });

    // Responsible Person sees only actions assigned to them
    if (user.role === Role.RESPONSIBLE_PERSON) {
      query = query.eq('assigned_to', user.id);
    }

    if (filters?.findingId) {
      query = query.eq('finding_id', filters.findingId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch corrective actions: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Get single corrective action with verification history.
   */
  async findActionById(id: string, user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    const { data: action, error } = await supabase
      .from('corrective_actions')
      .select(`
        *,
        finding:findings(id, title, risk_level, status, inspection_id),
        assignee:profiles!assigned_to(id, full_name, email, department)
      `)
      .eq('id', id)
      .single();

    if (error || !action) {
      throw new NotFoundException(`Corrective action ${id} not found.`);
    }

    // Role check
    if (user.role === Role.RESPONSIBLE_PERSON && action.assigned_to !== user.id) {
      throw new ForbiddenException('You can only view actions assigned to you.');
    }

    // Fetch verification log for this action
    const { data: verifications } = await supabase
      .from('verifications')
      .select(`
        *,
        verifier:profiles!verified_by(id, full_name, email)
      `)
      .eq('corrective_action_id', id)
      .order('verified_at', { ascending: false });

    return {
      ...action,
      verifications: verifications || [],
    };
  }

  /**
   * Update action details.
   */
  async updateAction(id: string, user: AuthUser, dto: UpdateCorrectiveActionDto) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findActionById(id, user);

    const updatePayload: Record<string, any> = {};
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.due_date !== undefined) updatePayload.due_date = dto.due_date;

    // Handle reassignment
    if (dto.assigned_to !== undefined) {
      updatePayload.assigned_to = dto.assigned_to;
      if (existing.status === ActionStatus.OPEN && dto.assigned_to) {
        updatePayload.status = ActionStatus.ASSIGNED;
      }
    }

    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
    }

    const { data, error } = await supabase
      .from('corrective_actions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update corrective action: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Responsible person submits action for safety officer verification.
   */
  async submitForVerification(id: string, user: AuthUser) {
    const supabase = this.supabaseService.getClient();

    const action = await this.findActionById(id, user);

    if (
      action.status === ActionStatus.PENDING_VERIFICATION ||
      action.status === ActionStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Action is already in ${action.status} status.`,
      );
    }

    const { data, error } = await supabase
      .from('corrective_actions')
      .update({
        status: ActionStatus.PENDING_VERIFICATION,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to submit action for verification: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Safety Officer verifies the completed corrective action.
   */
  async verifyAction(id: string, user: AuthUser, dto: VerifyActionDto) {
    const supabase = this.supabaseService.getClient();

    const action = await this.findActionById(id, user);

    if (action.status !== ActionStatus.PENDING_VERIFICATION) {
      throw new BadRequestException(
        `Only actions with status PENDING_VERIFICATION can be verified. Current status: ${action.status}`,
      );
    }

    // 1. Record verification outcome
    const { error: verErr } = await supabase
      .from('verifications')
      .insert({
        corrective_action_id: id,
        verified_by: user.id,
        result: dto.result,
        comments: dto.comments || null,
      });

    if (verErr) {
      throw new InternalServerErrorException(
        `Failed to save verification record: ${verErr.message}`,
      );
    }

    // 2. Transition action status
    const newStatus =
      dto.result === VerificationResult.APPROVED
        ? ActionStatus.CLOSED
        : ActionStatus.IN_PROGRESS;

    const { data: updatedAction, error: updErr } = await supabase
      .from('corrective_actions')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (updErr) {
      throw new InternalServerErrorException(
        `Failed to transition action status: ${updErr.message}`,
      );
    }

    // 3. If approved, check if all actions for this finding are now CLOSED
    if (dto.result === VerificationResult.APPROVED && action.finding_id) {
      const { data: remainingActions } = await supabase
        .from('corrective_actions')
        .select('id, status')
        .eq('finding_id', action.finding_id)
        .neq('status', ActionStatus.CLOSED);

      if (!remainingActions || remainingActions.length === 0) {
        // All corrective actions closed → resolve finding!
        await supabase
          .from('findings')
          .update({ status: FindingStatus.RESOLVED })
          .eq('id', action.finding_id);
      }
    }

    return {
      message: `Action verification recorded as ${dto.result}.`,
      action: updatedAction,
    };
  }
}
