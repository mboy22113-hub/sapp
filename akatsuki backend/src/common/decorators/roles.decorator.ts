/**
 * ===== roles.decorator.ts =====
 *
 * WHAT THIS FILE DOES:
 * Provides the `@Roles(...)` decorator to declare which user roles are allowed
 * to access an endpoint.
 *
 * IMPORTANT FUNCTIONS:
 * - Roles(...roles: Role[]) → Sets metadata key 'roles' with an array of allowed roles.
 *
 * USAGE EXAMPLES:
 * - @Roles(Role.ADMIN)
 * - @Roles(Role.ADMIN, Role.SAFETY_OFFICER)
 *
 * DATA FLOW:
 * 1. Controller method is tagged with `@Roles(Role.ADMIN)`.
 * 2. RolesGuard reads the required roles using NestJS `Reflector`.
 * 3. RolesGuard checks if `request.user.role` is included in that list.
 *
 * WHERE TO MODIFY LATER:
 * - If you add permission-based access (e.g. `@Permissions('inspection:create')`),
 *   you could build a similar decorator.
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
