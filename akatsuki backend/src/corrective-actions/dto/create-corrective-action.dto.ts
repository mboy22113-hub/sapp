/**
 * ===== create-corrective-action.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Validates request payload when creating a new corrective action for a finding.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCorrectiveActionDto {
  @ApiProperty({
    description: 'UUID of the safety finding that requires this corrective action',
    example: 'b22b0709-c2b4-4b47-8141-94943fcf3121',
  })
  @IsNotEmpty()
  @IsUUID('4')
  finding_id: string;

  @ApiProperty({
    description: 'Title of the action task to be completed',
    example: 'Replace discharged fire extinguisher in spray booth',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed instructions on how to rectify the finding',
    example: 'Coordinate with facility maintenance to procure and install a certified 10lb ABC dry chemical extinguisher.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'UUID of the responsible person assigned to complete this action',
    example: 'e44e0709-d3c5-5c58-9252-05054fdf4232',
  })
  @IsOptional()
  @IsUUID('4')
  assigned_to?: string;

  @ApiPropertyOptional({
    description: 'Target completion date (YYYY-MM-DD)',
    example: '2026-09-30',
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;
}
