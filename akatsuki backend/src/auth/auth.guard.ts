/**
 * ===== auth.guard.ts =====
 *
 * WHAT THIS FILE DOES:
 * Protects routes by validating the Bearer JWT token from the Authorization header.
 * It uses Supabase Auth to verify whether the token is valid, active, and belongs
 * to an existing user, then loads their profile (including role) from the database.
 *
 * IMPORTANT FUNCTIONS:
 * - canActivate(context) → Evaluates every incoming HTTP request:
 *   1. Checks if the endpoint has the `@Public()` decorator. If so, skips auth.
 *   2. Extracts the Bearer token from the `Authorization` header.
 *   3. Calls `supabase.auth.getUser(token)` to verify the JWT.
 *   4. Fetches the matching profile row from the `profiles` table.
 *   5. Attaches the user & role to `request.user` for controllers to use.
 *
 * DATA FLOW:
 * Client Request (with `Authorization: Bearer <token>`)
 *   ↓
 * AuthGuard
 *   ↓ (calls Supabase Auth API to verify token)
 * Token Valid?
 *   ├─ No  → Throws 401 UnauthorizedException
 *   └─ Yes → Fetches profile from `profiles` table
 *          → Attaches { id, email, role, fullName } to `request.user`
 *          → Proceeds to Controller / RolesGuard
 *
 * WHERE TO MODIFY LATER:
 * - If you cache user profile lookups (e.g., using Redis) for high performance.
 * - If you support API keys in addition to Bearer tokens.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Extract Authorization header
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header. Expected "Bearer <token>".',
      );
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token is empty.');
    }

    // 3. Verify token with Supabase Auth
    const supabase = this.supabaseService.getClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }

    const authUser = authData.user;

    // 4. Load user profile from public.profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, department')
      .eq('id', authUser.id)
      .single();

    // 5. Attach structured AuthUser object to request
    const userPayload: AuthUser = {
      id: authUser.id,
      email: authUser.email || '',
      role: (profile?.role as Role) || Role.INSPECTOR,
      fullName: profile?.full_name,
      department: profile?.department,
      accessToken: token,
    };

    request.user = userPayload;

    return true;
  }
}
