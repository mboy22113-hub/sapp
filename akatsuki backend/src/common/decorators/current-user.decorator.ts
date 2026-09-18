/**
 * ===== current-user.decorator.ts =====
 *
 * WHAT THIS FILE DOES:
 * Provides the `@CurrentUser()` custom parameter decorator.
 * It extracts the authenticated user (attached to request.user by AuthGuard)
 * directly into your controller method arguments.
 *
 * IMPORTANT FUNCTIONS:
 * - CurrentUser(data?: string) → Custom decorator extracting either the entire
 *   user object or a specific field (e.g. @CurrentUser('id')).
 *
 * USAGE EXAMPLES:
 * - @Get('me')
 *   getProfile(@CurrentUser() user: AuthUser) { return user; }
 *
 * - @Post('inspections')
 *   create(@CurrentUser('id') userId: string) { ... }
 *
 * DATA FLOW:
 * 1. AuthGuard validates JWT and fetches user profile.
 * 2. AuthGuard attaches the payload to `request.user`.
 * 3. In controller methods, `@CurrentUser()` reads from `request.user` and injects it.
 *
 * WHERE TO MODIFY LATER:
 * - If you store additional user context on request (e.g., organizationId),
 *   you can read or type it here.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  fullName?: string;
  department?: string;
  accessToken?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
