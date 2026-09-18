/**
 * ===== users.module.ts =====
 *
 * WHAT THIS FILE DOES:
 * Bundles the UsersController, UsersService, and guards together.
 *
 * DATA FLOW:
 * Imported into AppModule so its routes (/profile, /users) are exposed.
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
