/**
 * ===== update-profile.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Defines and validates the data a user can submit when updating their own profile.
 * Notice: Users CANNOT change their own role here — only full_name and department.
 *
 * VALIDATION RULES:
 * - fullName: optional string, 2-100 characters
 * - department: optional string, up to 100 characters
 *
 * WHERE TO MODIFY LATER:
 * - Add fields like `phoneNumber`, `bio`, or `avatarUrl` if you expand the user profile.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional({
    description: 'Department or division within the organization',
    example: 'Safety & Operations',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;
}
