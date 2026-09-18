/**
 * ===== corrective-actions.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * Exposes REST endpoints for the corrective action and verification lifecycle.
 *
 * ENDPOINTS:
 * - POST  /corrective-actions                     → Create action (Inspector / Safety Officer / Admin)
 * - GET   /corrective-actions                     → List actions (scoped to role)
 * - GET   /corrective-actions/:id                 → Get action details + verification trail
 * - PATCH /corrective-actions/:id                 → Update action metadata/assignment
 * - POST  /corrective-actions/:id/submit-verification → Responsible person marks work done
 * - POST  /corrective-actions/:id/verify          → Safety officer verifies (Approved/Rejected)
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
import { CorrectiveActionsService } from './corrective-actions.service';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { VerifyActionDto } from './dto/verify-action.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ActionStatus } from '../common/enums/action-status.enum';

@ApiTags('Corrective Actions & Verification')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('corrective-actions')
export class CorrectiveActionsController {
  constructor(private readonly actionsService: CorrectiveActionsService) {}

  @Post()
  @Roles(Role.INSPECTOR, Role.SAFETY_OFFICER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new corrective action for a finding' })
  @ApiResponse({ status: 201, description: 'Action created' })
  createAction(@Body() dto: CreateCorrectiveActionDto) {
    return this.actionsService.createAction(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List corrective actions (scoped to user role)' })
  @ApiQuery({ name: 'findingId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ActionStatus })
  @ApiQuery({ name: 'assignedTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of actions' })
  findAllActions(
    @CurrentUser() user: AuthUser,
    @Query('findingId') findingId?: string,
    @Query('status') status?: ActionStatus,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.actionsService.findAllActions(user, {
      findingId,
      status,
      assignedTo,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get corrective action details with verification history' })
  @ApiResponse({ status: 200, description: 'Action details' })
  @ApiResponse({ status: 404, description: 'Action not found' })
  findActionById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.actionsService.findActionById(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update action details or reassign' })
  @ApiResponse({ status: 200, description: 'Action updated' })
  updateAction(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCorrectiveActionDto,
  ) {
    return this.actionsService.updateAction(id, user, dto);
  }

  @Post(':id/submit-verification')
  @ApiOperation({ summary: 'Responsible person submits action for safety officer review' })
  @ApiResponse({ status: 200, description: 'Status moved to PENDING_VERIFICATION' })
  submitForVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.actionsService.submitForVerification(id, user);
  }

  @Post(':id/verify')
  @Roles(Role.SAFETY_OFFICER, Role.ADMIN)
  @ApiOperation({ summary: 'Safety Officer approves or rejects the action' })
  @ApiResponse({ status: 200, description: 'Verification recorded and status updated' })
  @ApiResponse({ status: 400, description: 'Action not in PENDING_VERIFICATION state' })
  verifyAction(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyActionDto,
  ) {
    return this.actionsService.verifyAction(id, user, dto);
  }
}
