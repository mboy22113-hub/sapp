/**
 * ===== update-inspection.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates updates to an existing inspection (site name, department, status).
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InspectionStatus } from '../../common/enums/inspection-status.enum';

export class UpdateInspectionDto {
  @ApiPropertyOptional({
    description: 'Updated site name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  site_name?: string;

  @ApiPropertyOptional({
    description: 'Updated department',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({
    description: 'Updated status of the inspection',
    enum: InspectionStatus,
  })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;
}
