/**
 * ===== update-checklist-item.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates updates to an existing checklist item.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateChecklistItemDto {
  @ApiPropertyOptional({
    description: 'Updated inspection question',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  question?: string;

  @ApiPropertyOptional({
    description: 'Updated guidance description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated category',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Updated sort order index',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
