/**
 * ===== update-checklist.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates request payload when an Admin updates an existing Checklist template.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChecklistDto {
  @ApiPropertyOptional({
    description: 'Updated name of the checklist template',
    example: 'Fire Safety Inspection (Revised 2026)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the checklist',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
