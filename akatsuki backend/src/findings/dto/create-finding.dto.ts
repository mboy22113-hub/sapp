/**
 * ===== create-finding.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates payload when an Inspector or Safety Officer reports a new finding.
 * Notice: Frontend NEVER supplies risk_score or risk_level directly.
 * Those are computed securely by the backend!
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateFindingDto {
  @ApiProperty({
    description: 'UUID of the inspection session where this issue was identified',
    example: 'a11a0709-b1c4-4b47-8141-94943fcf3121',
  })
  @IsNotEmpty()
  @IsUUID('4')
  inspection_id: string;

  @ApiProperty({
    description: 'Concise summary of the safety issue',
    example: 'Fire extinguisher pressure gauge indicates empty',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed explanation of the observation and hazard',
    example: 'Extinguisher located near spray paint booth has zero pressure and is missing inspection tag.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Likelihood of hazard occurrence (1 = Rare, 5 = Almost Certain)',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  likelihood: number;

  @ApiProperty({
    description: 'Severity of potential consequences (1 = Negligible, 5 = Catastrophic)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  severity: number;
}
