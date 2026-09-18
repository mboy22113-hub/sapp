/**
 * ===== supabase.module.ts =====
 *
 * WHAT THIS FILE DOES:
 * This is a NestJS "module" that packages the SupabaseService so other
 * modules can use it. It's marked as @Global() so you don't have to
 * import it in every single module — it's available everywhere automatically.
 *
 * HOW NESTJS MODULES WORK (beginner explanation):
 * - A "module" is a container that groups related code together
 * - "providers" are services that this module creates
 * - "exports" are services that OTHER modules can use
 * - @Global() means this module is available to all modules without importing
 *
 * WHY GLOBAL?
 * Almost every module in SafeTrack needs to talk to Supabase (database queries,
 * auth checks, file uploads). Making this global avoids repetitive imports.
 */

import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
