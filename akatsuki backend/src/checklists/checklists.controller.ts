/**
 * ===== checklists.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * Exposes REST endpoints for managing inspection checklists and checklist items.
 *
 * ENDPOINTS:
 * - POST   /checklists             → Create checklist template (Admin only)
 * - GET    /checklists             → List all checklist templates
 * - GET    /checklists/:id         → Get checklist details including questions
 * - PATCH  /checklists/:id         → Update checklist template (Admin only)
 * - DELETE /checklists/:id         → Delete checklist template (Admin only)
 * - POST   /checklists/:id/items   → Add question item to checklist (Admin only)
 * - GET    /checklists/:id/items   → List all questions for a checklist
 * - PATCH  /checklist-items/:id    → Update specific question (Admin only)
 * - DELETE /checklist-items/:id    → Delete question item (Admin only)
 *
 * SECURITY:
 * All endpoints require JWT authentication.
 * Template modification requires the ADMIN role.
 *
 * WHERE TO MODIFY LATER:
 * - If you allow Safety Officers or Lead Inspectors to author checklists as well,
 *   update the `@Roles(...)` decorators.
 */

import {
  Body,
  Controller,
  Delete,
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
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Checklists')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post('checklists')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new checklist template (Admin only)' })
  @ApiResponse({ status: 201, description: 'Checklist created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  createChecklist(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChecklistDto,
  ) {
    return this.checklistsService.createChecklist(userId, dto);
  }

  @Get('checklists')
  @ApiOperation({ summary: 'List all available checklist templates' })
  @ApiResponse({ status: 200, description: 'List of checklists' })
  findAllChecklists() {
    return this.checklistsService.findAllChecklists();
  }

  @Get('checklists/:id')
  @ApiOperation({ summary: 'Get checklist details including its question items' })
  @ApiResponse({ status: 200, description: 'Checklist details' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  findChecklistById(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistsService.findChecklistById(id);
  }

  @Patch('checklists/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a checklist template (Admin only)' })
  @ApiResponse({ status: 200, description: 'Checklist updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  updateChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChecklistDto,
  ) {
    return this.checklistsService.updateChecklist(id, dto);
  }

  @Delete('checklists/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a checklist template and items (Admin only)' })
  @ApiResponse({ status: 200, description: 'Checklist deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  deleteChecklist(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistsService.deleteChecklist(id);
  }

  // --- Checklist Items Endpoints ---

  @Post('checklists/:id/items')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add a question item to a checklist (Admin only)' })
  @ApiResponse({ status: 201, description: 'Checklist item added' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  addItemToChecklist(
    @Param('id', ParseUUIDPipe) checklistId: string,
    @Body() dto: CreateChecklistItemDto,
  ) {
    return this.checklistsService.addItemToChecklist(checklistId, dto);
  }

  @Get('checklists/:id/items')
  @ApiOperation({ summary: 'List all questions for a specific checklist' })
  @ApiResponse({ status: 200, description: 'List of checklist items' })
  findItemsByChecklist(@Param('id', ParseUUIDPipe) checklistId: string) {
    return this.checklistsService.findItemsByChecklist(checklistId);
  }

  @Patch('checklist-items/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a checklist question item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  updateChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.checklistsService.updateChecklistItem(id, dto);
  }

  @Delete('checklist-items/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a checklist question item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  deleteChecklistItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistsService.deleteChecklistItem(id);
  }
}
