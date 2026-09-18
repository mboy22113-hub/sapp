/**
 * ===== roles.guard.ts =====
 *
 * WHAT THIS FILE DOES:
 * Implements Role-Based Access Control (RBAC). It checks if the authenticated user
 * has one of the roles declared with `@Roles(...)` on the route handler.
 *
 * IMPORTANT FUNCTIONS:
 * - canActivate(context) →
 *   1. Reads required roles metadata from the endpoint.
 *   2. If no roles specified, everyone (authenticated) is allowed.
 *   3. Checks if the user's role matches any of the required roles.
 *   4. Returns true if permitted, or throws 403 ForbiddenException if not.
 *
 * DATA FLOW:
 * Request passing AuthGuard (user already verified)
 *   ↓
 * RolesGuard
 *   ↓
 * Any @Roles(...) specified on method/controller?
 *   ├─ No  → Allowed (returns true)
 *   └─ Yes → Does request.user.role match?
 *          ├─ Yes → Allowed (returns true)
 *          └─ No  → Throws 403 ForbiddenException
 *
 * WHERE TO MODIFY LATER:
 * - If ADMIN should automatically bypass all role checks (superuser),
 *   you can check `if (user.role === Role.ADMIN) return true;`.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified on endpoint, any authenticated user can proceed
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Access denied: user role could not be determined.',
      );
    }

    // Admins have access to everything
    if (user.role === Role.ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Requires one of: [${requiredRoles.join(', ')}]. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
