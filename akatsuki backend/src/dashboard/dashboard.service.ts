/**
 * ===== dashboard.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Aggregates safety intelligence across inspections, findings, and corrective actions:
 * 1. High-level KPIs & executive summary.
 * 2. Risk profile distribution (LOW / MEDIUM / HIGH / CRITICAL).
 * 3. Site compliance percentage: (PASS / (PASS + FAIL)) × 100%.
 * 4. Overdue corrective actions alerting.
 * 5. Recurring safety findings pattern detection (identifies repeated hazards).
 *
 * IMPORTANT FUNCTIONS:
 * - getSummary()           → Totals and status breakdowns.
 * - getRiskDistribution()  → Counts and percentages per risk tier.
 * - getCompliance()        → Pass/Fail/NA ratios and calculated compliance score.
 * - getOverdueActions()    → Unclosed tasks with due dates in the past.
 * - getRecurringFindings() → Finds repeated hazard titles across sites.
 *
 * DATA FLOW:
 * Dashboard Controller calls methods
 *   ↓
 * Service runs PostgREST queries on inspections, findings, responses, actions
 *   ↓
 * In-memory compute formats clean metric summaries
 *   ↓
 * Returns JSON to frontend for charts and KPI cards
 *
 * WHERE TO MODIFY LATER:
 * - Add date-range filters (e.g., this week, last 30 days, quarterly).
 * - Add site-specific or department-specific filtering.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { RiskLevel } from '../common/enums/risk-level.enum';
import { ActionStatus } from '../common/enums/action-status.enum';
import { Answer } from '../common/enums/answer.enum';

@Injectable()
export class DashboardService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * High-level counts and breakdown summary.
   */
  async getSummary() {
    const supabase = this.supabaseService.getClient();

    const [inspectionsRes, findingsRes, actionsRes] = await Promise.all([
      supabase.from('inspections').select('status'),
      supabase.from('findings').select('status, risk_level'),
      supabase.from('corrective_actions').select('status, due_date'),
    ]);

    if (inspectionsRes.error || findingsRes.error || actionsRes.error) {
      throw new InternalServerErrorException('Failed to load dashboard metrics.');
    }

    const inspections = inspectionsRes.data || [];
    const findings = findingsRes.data || [];
    const actions = actionsRes.data || [];

    const today = new Date().toISOString().split('T')[0];

    return {
      inspections: {
        total: inspections.length,
        completed: inspections.filter((i) => i.status === 'COMPLETED').length,
        in_progress: inspections.filter((i) => i.status === 'IN_PROGRESS').length,
        draft: inspections.filter((i) => i.status === 'DRAFT').length,
      },
      findings: {
        total: findings.length,
        open: findings.filter((f) => f.status === 'OPEN').length,
        in_progress: findings.filter((f) => f.status === 'IN_PROGRESS').length,
        resolved: findings.filter((f) => f.status === 'RESOLVED').length,
        closed: findings.filter((f) => f.status === 'CLOSED').length,
        critical: findings.filter((f) => f.risk_level === RiskLevel.CRITICAL).length,
      },
      corrective_actions: {
        total: actions.length,
        pending_verification: actions.filter(
          (a) => a.status === ActionStatus.PENDING_VERIFICATION,
        ).length,
        open_or_assigned: actions.filter(
          (a) => a.status === ActionStatus.OPEN || a.status === ActionStatus.ASSIGNED,
        ).length,
        in_progress: actions.filter((a) => a.status === ActionStatus.IN_PROGRESS).length,
        closed: actions.filter((a) => a.status === ActionStatus.CLOSED).length,
        overdue: actions.filter(
          (a) => a.status !== ActionStatus.CLOSED && a.due_date && a.due_date < today,
        ).length,
      },
    };
  }

  /**
   * Risk distribution breakdown by tier (counts and percentages).
   */
  async getRiskDistribution() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.from('findings').select('risk_level');

    if (error) {
      throw new InternalServerErrorException('Failed to fetch risk distribution.');
    }

    const findings = data || [];
    const total = findings.length;

    const counts: Record<RiskLevel, number> = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    };

    findings.forEach((f) => {
      const level = f.risk_level as RiskLevel;
      if (counts[level] !== undefined) {
        counts[level]++;
      }
    });

    return {
      total,
      distribution: Object.entries(counts).map(([level, count]) => ({
        level,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      })),
    };
  }

  /**
   * Overall checklist compliance metrics.
   * Compliance Rate = (PASS / (PASS + FAIL)) * 100%
   */
  async getCompliance() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('inspection_responses')
      .select('answer');

    if (error) {
      throw new InternalServerErrorException('Failed to fetch compliance stats.');
    }

    const responses = data || [];
    const passCount = responses.filter((r) => r.answer === Answer.PASS).length;
    const failCount = responses.filter((r) => r.answer === Answer.FAIL).length;
    const naCount = responses.filter((r) => r.answer === Answer.NA).length;
    const evaluatedCount = passCount + failCount;

    const complianceRate =
      evaluatedCount > 0 ? Number(((passCount / evaluatedCount) * 100).toFixed(1)) : 100;

    return {
      total_responses: responses.length,
      pass: passCount,
      fail: failCount,
      not_applicable: naCount,
      compliance_rate_percentage: complianceRate,
    };
  }

  /**
   * List all corrective actions that are past their due date and not closed.
   */
  async getOverdueActions() {
    const supabase = this.supabaseService.getClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('corrective_actions')
      .select(`
        id,
        title,
        status,
        due_date,
        created_at,
        finding:findings(id, title, risk_level),
        assignee:profiles!assigned_to(id, full_name, email, department)
      `)
      .lt('due_date', today)
      .neq('status', ActionStatus.CLOSED)
      .order('due_date', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('Failed to fetch overdue actions.');
    }

    return data || [];
  }

  /**
   * Detect recurring safety findings across inspections.
   * Groups findings with identical or similar titles appearing > 1 time.
   */
  async getRecurringFindings() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('findings')
      .select(`
        id,
        title,
        risk_level,
        created_at,
        inspection:inspections(id, site_name, department)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Failed to detect recurring findings.');
    }

    // Group by normalized lowercase title
    const grouped: Record<
      string,
      {
        title: string;
        occurrences: number;
        highest_risk: RiskLevel;
        sites: string[];
        finding_ids: string[];
      }
    > = {};

    (data || []).forEach((f: any) => {
      const key = f.title.trim().toLowerCase();
      const site = f.inspection?.site_name || 'Unknown Site';

      if (!grouped[key]) {
        grouped[key] = {
          title: f.title,
          occurrences: 0,
          highest_risk: f.risk_level,
          sites: [],
          finding_ids: [],
        };
      }

      grouped[key].occurrences++;
      grouped[key].finding_ids.push(f.id);
      if (!grouped[key].sites.includes(site)) {
        grouped[key].sites.push(site);
      }
    });

    // Only return items that occur at least twice
    const recurring = Object.values(grouped)
      .filter((item) => item.occurrences > 1)
      .sort((a, b) => b.occurrences - a.occurrences);

    return recurring;
  }
}
