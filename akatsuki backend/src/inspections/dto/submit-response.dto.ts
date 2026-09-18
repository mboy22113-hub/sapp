/**
 * ===== submit-response.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates an inspector's answer (PASS, FAIL, NA) to a specific checklist question.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Answer } from '../../common/enums/answer.enum';

export class SubmitResponseDto {
  @ApiProperty({
    description: 'UUID of the checklist question being answered',
    example: 'd33d0709-b2c5-5c58-9252-05054fdf4232',
  })
  @IsNotEmpty()
  @IsUUID('4')
  checklist_item_id: string;

  @ApiProperty({
    description: 'Inspector response evaluation',
    enum: Answer,
    example: Answer.FAIL,
  })
  @IsNotEmpty()
  @IsEnum(Answer, {
    message: `Answer must be one of: ${Object.values(Answer).join(', ')}`,
  })
  answer: Answer;

  @ApiPropertyOptional({
    description: 'Inspector observations, notes, or explanations for this item',
    example: 'Exit door is obstructed by broken wooden pallets.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observation?: string;
}
