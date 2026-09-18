/**
 * ===== create-inspection.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates payload when an Inspector initiates a new inspection session.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateInspectionDto {
  @ApiProperty({
    description: 'Name of the facility, site, or location being inspected',
    example: 'Main Manufacturing Plant - Building B',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  site_name: string;

  @ApiPropertyOptional({
    description: 'Department within the site',
    example: 'Assembly Line 3',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiProperty({
    description: 'UUID of the checklist template to follow for this inspection',
    example: 'c22c0709-a1b4-4b47-8141-94943fcf3121',
  })
  @IsNotEmpty()
  @IsUUID('4')
  checklist_id: string;
}
