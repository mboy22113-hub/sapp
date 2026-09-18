/**
 * ===== create-checklist-item.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates the question/item being added to an existing checklist.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateChecklistItemDto {
  @ApiProperty({
    description: 'The inspection question to be answered by the inspector',
    example: 'Are all emergency exits clearly marked and unobstructed?',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  question: string;

  @ApiPropertyOptional({
    description: 'Additional guidance or reference for this item',
    example: 'Check signage luminosity and ensure no storage pallets block door swing.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Category grouping (e.g. Fire Safety, Electrical, PPE)',
    example: 'Fire Safety',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Order in which this question should appear in the checklist',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
