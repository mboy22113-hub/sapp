/**
 * ===== verify-action.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates the safety officer's verification submission (APPROVED or REJECTED)
 * for a corrective action that is currently in PENDING_VERIFICATION status.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { VerificationResult } from '../../common/enums/verification-result.enum';

export class VerifyActionDto {
  @ApiProperty({
    description: 'Outcome of safety verification',
    enum: VerificationResult,
    example: VerificationResult.APPROVED,
  })
  @IsNotEmpty()
  @IsEnum(VerificationResult, {
    message: `Result must be one of: ${Object.values(VerificationResult).join(', ')}`,
  })
  result: VerificationResult;

  @ApiPropertyOptional({
    description: 'Review notes, reasons for rejection, or compliance notes',
    example: 'Inspected replacement unit in spray booth; gauge verified at optimal pressure and tag attached.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}
