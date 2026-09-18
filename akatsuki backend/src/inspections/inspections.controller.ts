/**
 * ===== inspections.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * Exposes REST endpoints for managing the inspection workflow.
 *
 * ENDPOINTS:
 * - POST   /inspections                 → Start a new inspection session
 * - GET    /inspections                 → List inspections (filtered by user role)
 * - GET    /inspections/:id             → Get full inspection details + responses
 * - PATCH  /inspections/:id             → Update inspection metadata
 * - POST   /inspections/:id/complete    → Finalize inspection
 * - POST   /inspections/:id/responses   → Submit an answer for a checklist question
 * - GET    /inspections/:id/responses   → Get all answers for an inspection
 * - PATCH  /inspection-responses/:id    → Edit a previously submitted answer
 *
 * DATA FLOW:
 * Client HTTP Request
 *   ↓
 * AuthGuard & RolesGuard
 *   ↓
 * Injects AuthUser into service
 *   ↓
 * InspectionsService updates database
 *   ↓
 * Returns JSON response
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Inspections')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post('inspections')
  @Roles(Role.INSPECTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new inspection session' })
  @ApiResponse({ status: 201, description: 'Inspection created in DRAFT status' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  createInspection(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInspectionDto,
  ) {
    return this.inspectionsService.createInspection(userId, dto);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'List inspections (scoped to role: Inspectors see own, Admins/Officers see all)' })
  @ApiResponse({ status: 200, description: 'List of inspections' })
  findAllInspections(@CurrentUser() user: AuthUser) {
    return this.inspectionsService.findAllInspections(user);
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Get inspection details with checklist and responses' })
  @ApiResponse({ status: 200, description: 'Inspection details' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  findInspectionById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspectionsService.findInspectionById(id, user);
  }

  @Patch('inspections/:id')
  @ApiOperation({ summary: 'Update inspection header details' })
  @ApiResponse({ status: 200, description: 'Inspection updated' })
  updateInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateInspectionDto,
  ) {
    return this.inspectionsService.updateInspection(id, user, dto);
  }

  @Post('inspections/:id/complete')
  @ApiOperation({ summary: 'Finalize inspection and lock it as COMPLETED' })
  @ApiResponse({ status: 200, description: 'Inspection completed' })
  @ApiResponse({ status: 400, description: 'Validation failure or already completed' })
  completeInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspectionsService.completeInspection(id, user);
  }

  @Post('inspections/:id/responses')
  @ApiOperation({ summary: 'Submit or update an answer to a checklist question' })
  @ApiResponse({ status: 201, description: 'Response recorded' })
  @ApiResponse({ status: 400, description: 'Inspection already completed or invalid data' })
  submitResponse(
    @Param('id', ParseUUIDPipe) inspectionId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.inspectionsService.submitResponse(inspectionId, user, dto);
  }

  @Get('inspections/:id/responses')
  @ApiOperation({ summary: 'Get all recorded responses for an inspection' })
  @ApiResponse({ status: 200, description: 'List of responses' })
  getResponses(
    @Param('id', ParseUUIDPipe) inspectionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspectionsService.getResponses(inspectionId, user);
  }

  @Patch('inspection-responses/:id')
  @ApiOperation({ summary: 'Update an existing response observation or answer' })
  @ApiResponse({ status: 200, description: 'Response updated' })
  updateResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateResponseDto,
  ) {
    return this.inspectionsService.updateResponse(id, user, dto);
  }
}
