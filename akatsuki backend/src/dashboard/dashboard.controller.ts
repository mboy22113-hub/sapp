/**
 * ===== dashboard.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * Exposes REST analytics endpoints powering the executive safety dashboard.
 *
 * ENDPOINTS:
 * - GET /dashboard/summary             → KPI overview across inspections, findings, actions
 * - GET /dashboard/risk-distribution   → Breakdowns by risk tier (counts and percentages)
 * - GET /dashboard/compliance          → Pass/fail compliance rates
 * - GET /dashboard/overdue-actions     → Overdue actions requiring immediate attention
 * - GET /dashboard/recurring-findings  → Repetitive safety issues across sites
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Dashboard & Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get high-level summary KPIs and count metrics' })
  @ApiResponse({ status: 200, description: 'Summary statistics' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('risk-distribution')
  @ApiOperation({ summary: 'Get distribution of findings across risk severity tiers' })
  @ApiResponse({ status: 200, description: 'Risk distribution counts and percentages' })
  getRiskDistribution() {
    return this.dashboardService.getRiskDistribution();
  }

  @Get('compliance')
  @ApiOperation({ summary: 'Get checklist response compliance rates' })
  @ApiResponse({ status: 200, description: 'Compliance statistics' })
  getCompliance() {
    return this.dashboardService.getCompliance();
  }

  @Get('overdue-actions')
  @ApiOperation({ summary: 'List all overdue corrective actions' })
  @ApiResponse({ status: 200, description: 'List of overdue actions' })
  getOverdueActions() {
    return this.dashboardService.getOverdueActions();
  }

  @Get('recurring-findings')
  @ApiOperation({ summary: 'Identify recurring safety hazards appearing multiple times' })
  @ApiResponse({ status: 200, description: 'Recurring findings list' })
  getRecurringFindings() {
    return this.dashboardService.getRecurringFindings();
  }
}
