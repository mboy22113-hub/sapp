/**
 * ===== update-response.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates updates to an existing inspection response.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Answer } from '../../common/enums/answer.enum';

export class UpdateResponseDto {
  @ApiPropertyOptional({
    description: 'Updated answer',
    enum: Answer,
  })
  @IsOptional()
  @IsEnum(Answer)
  answer?: Answer;

  @ApiPropertyOptional({
    description: 'Updated observation notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observation?: string;
}
