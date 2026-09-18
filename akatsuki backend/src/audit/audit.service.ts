/**
 * ===== audit.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Provides a tamper-evident audit logging service.
 * It writes immutable records to the `audit_logs` table whenever significant
 * business actions happen (inspections completed, findings recorded, actions verified).
 *
 * IMPORTANT FUNCTIONS:
 * - log(userId, action, entityType, entityId, metadata) → Saves an audit event.
 * - getLogs(filters) → Allows admins to retrieve audit history.
 *
 * DATA FLOW:
 * Services call `auditService.log(...)` in background.
 * Writes directly via service-role Supabase client.
 *
 * WHERE TO MODIFY LATER:
 * - Ship audit logs to an external SIEM tool (e.g. Datadog or Splunk).
 */

import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditAction } from '../common/enums/audit-action.enum';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Record an immutable audit log entry.
   */
  async log(
    userId: string,
    action: AuditAction | string,
    entityType: string,
    entityId: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const { error } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
      });

      if (error) {
        this.logger.error(
          `Failed to record audit log: ${error.message}`,
          error.details,
        );
      }
    } catch (err: any) {
      // Don't crash the main business operation if audit write fails
      this.logger.error(`Audit logging encountered exception: ${err.message}`);
    }
  }

  /**
   * Query the audit logs (Admin only).
   */
  async getLogs(limit = 100, entityType?: string, entityId?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        actor:profiles!user_id(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Failed to fetch audit logs: ${error.message}`);
      return [];
    }

    return data || [];
  }
}
