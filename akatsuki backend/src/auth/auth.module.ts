/**
 * ===== auth.module.ts =====
 *
 * WHAT THIS FILE DOES:
 * Bundles authentication and authorization providers into a reusable NestJS module.
 * It provides and exports AuthGuard and RolesGuard.
 *
 * IMPORTANT COMPONENTS:
 * - AuthGuard  → Validates Bearer JWTs via Supabase Auth
 * - RolesGuard → Enforces RBAC permissions based on user role
 *
 * DATA FLOW:
 * Imported by AppModule and applied globally or per-controller.
 *
 * WHERE TO MODIFY LATER:
 * - If you create custom auth strategies or auth controllers (e.g., custom login/refresh proxy).
 */

import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard],
})
export class AuthModule {}
