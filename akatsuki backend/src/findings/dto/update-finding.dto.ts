/**
 * ===== update-finding.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates updates to a finding. If likelihood or severity are updated,
 * the backend recalculates risk_score and risk_level automatically.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { FindingStatus } from '../../common/enums/finding-status.enum';

export class UpdateFindingDto {
  @ApiPropertyOptional({
    description: 'Updated finding title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated finding description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated likelihood (1–5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  likelihood?: number;

  @ApiPropertyOptional({
    description: 'Updated severity (1–5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  severity?: number;

  @ApiPropertyOptional({
    description: 'Updated finding lifecycle status',
    enum: FindingStatus,
  })
  @IsOptional()
  @IsEnum(FindingStatus)
  status?: FindingStatus;
}
