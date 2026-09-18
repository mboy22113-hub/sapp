/**
 * ===== public.decorator.ts =====
 *
 * WHAT THIS FILE DOES:
 * Provides the `@Public()` custom decorator.
 * By default, endpoints will require an authenticated user.
 * Applying `@Public()` to a controller method (or controller class)
 * tells our AuthGuard to bypass authentication for that endpoint.
 *
 * IMPORTANT FUNCTIONS:
 * - Public() → Sets metadata flag 'isPublic' to true on the route handler.
 *
 * DATA FLOW:
 * 1. A route handler is decorated with @Public()
 * 2. When a request arrives, AuthGuard checks reflector.getAllAndOverride(IS_PUBLIC_KEY, ...)
 * 3. If true, AuthGuard allows the request through without checking JWT.
 *
 * WHERE TO MODIFY LATER:
 * - Rarely needs modification. Use it on endpoints like /health, login/signup, or docs.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
