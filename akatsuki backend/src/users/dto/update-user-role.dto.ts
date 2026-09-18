/**
 * ===== update-user-role.dto.ts =====
 *
 * WHAT THIS FILE DOES:
 * Defines and validates the payload when an ADMIN changes another user's role.
 *
 * VALIDATION RULES:
 * - role: required valid enum value (ADMIN, INSPECTOR, SAFETY_OFFICER, RESPONSIBLE_PERSON)
 *
 * WHERE TO MODIFY LATER:
 * - If you add custom permissions or role expiration dates.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role assigned to the user',
    enum: Role,
    example: Role.SAFETY_OFFICER,
  })
  @IsNotEmpty()
  @IsEnum(Role, {
    message: `Role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role: Role;
}
