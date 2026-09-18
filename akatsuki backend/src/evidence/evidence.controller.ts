/**
 * ===== evidence.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * Exposes REST endpoints for the evidence upload and viewing lifecycle.
 *
 * ENDPOINTS:
 * - POST   /findings/:id/evidence/upload-url → Get signed upload URL for Supabase Storage
 * - POST   /findings/:id/evidence            → Save file metadata after upload
 * - GET    /findings/:id/evidence            → Get all evidence with signed view URLs
 * - DELETE /evidence/:id                     → Delete evidence record and file
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { SaveEvidenceDto } from './dto/save-evidence.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Evidence')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('findings/:id/evidence/upload-url')
  @ApiOperation({ summary: 'Request a signed upload URL to upload evidence directly to Supabase Storage' })
  @ApiResponse({ status: 201, description: 'Signed upload URL generated' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size exceeds 10 MB' })
  createUploadUrl(
    @Param('id', ParseUUIDPipe) findingId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.evidenceService.createUploadUrl(findingId, user, dto);
  }

  @Post('findings/:id/evidence')
  @ApiOperation({ summary: 'Save evidence metadata after successful storage upload' })
  @ApiResponse({ status: 201, description: 'Evidence record saved' })
  saveEvidence(
    @Param('id', ParseUUIDPipe) findingId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveEvidenceDto,
  ) {
    return this.evidenceService.saveEvidence(findingId, user, dto);
  }

  @Get('findings/:id/evidence')
  @ApiOperation({ summary: 'List all evidence attachments for a finding with signed download URLs' })
  @ApiResponse({ status: 200, description: 'List of evidence records' })
  getEvidenceForFinding(
    @Param('id', ParseUUIDPipe) findingId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.evidenceService.getEvidenceForFinding(findingId, user);
  }

  @Delete('evidence/:id')
  @ApiOperation({ summary: 'Delete an evidence record and remove file from storage' })
  @ApiResponse({ status: 200, description: 'Evidence deleted' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  deleteEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.evidenceService.deleteEvidence(id, user);
  }
}
