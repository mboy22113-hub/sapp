/**
 * ===== update-corrective-action.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates updates to a corrective action (title, assignment, status, due date).
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ActionStatus } from '../../common/enums/action-status.enum';

export class UpdateCorrectiveActionDto {
  @ApiPropertyOptional({
    description: 'Updated action title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated action description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Reassigned user UUID',
  })
  @IsOptional()
  @IsUUID('4')
  assigned_to?: string;

  @ApiPropertyOptional({
    description: 'Updated due date',
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({
    description: 'Direct status override',
    enum: ActionStatus,
  })
  @IsOptional()
  @IsEnum(ActionStatus)
  status?: ActionStatus;
}
