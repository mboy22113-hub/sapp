/**
 * ===== create-checklist.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates request payload when an Admin creates a new Checklist template.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChecklistDto {
  @ApiProperty({
    description: 'Name of the checklist template',
    example: 'Fire Safety & Hazard Inspection',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description or scope of the checklist',
    example: 'Standard quarterly safety check for manufacturing facilities.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
