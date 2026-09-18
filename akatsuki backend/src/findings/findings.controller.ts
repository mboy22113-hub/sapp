/**
 * ===== findings.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * Exposes REST endpoints for creating, listing, viewing, and updating safety findings.
 *
 * ENDPOINTS:
 * - POST  /findings      → Report a new safety finding (computes risk score automatically)
 * - GET   /findings      → List findings (can filter by inspectionId, status, riskLevel)
 * - GET   /findings/:id  → Retrieve detailed finding including evidence and corrective actions
 * - PATCH /findings/:id  → Update finding (recalculates risk matrix if likelihood/severity change)
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { FindingStatus } from '../common/enums/finding-status.enum';
import { RiskLevel } from '../common/enums/risk-level.enum';

@ApiTags('Findings & Risk')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Post()
  @Roles(Role.INSPECTOR, Role.SAFETY_OFFICER, Role.ADMIN)
  @ApiOperation({ summary: 'Report a safety finding (risk is calculated by backend)' })
  @ApiResponse({ status: 201, description: 'Finding created with computed risk score & level' })
  @ApiResponse({ status: 400, description: 'Validation error (e.g. likelihood/severity out of range)' })
  createFinding(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFindingDto,
  ) {
    return this.findingsService.createFinding(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List findings (filtered by role and optional query parameters)' })
  @ApiQuery({ name: 'inspectionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: FindingStatus })
  @ApiQuery({ name: 'riskLevel', required: false, enum: RiskLevel })
  @ApiResponse({ status: 200, description: 'List of findings ordered by risk severity' })
  findAllFindings(
    @CurrentUser() user: AuthUser,
    @Query('inspectionId') inspectionId?: string,
    @Query('status') status?: FindingStatus,
    @Query('riskLevel') riskLevel?: RiskLevel,
  ) {
    return this.findingsService.findAllFindings(user, {
      inspectionId,
      status,
      riskLevel,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get finding details with attached evidence and corrective actions' })
  @ApiResponse({ status: 200, description: 'Finding details' })
  @ApiResponse({ status: 404, description: 'Finding not found' })
  findFindingById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.findingsService.findFindingById(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update finding (risk recalculated if likelihood/severity changes)' })
  @ApiResponse({ status: 200, description: 'Finding updated' })
  updateFinding(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateFindingDto,
  ) {
    return this.findingsService.updateFinding(id, user, dto);
  }
}
