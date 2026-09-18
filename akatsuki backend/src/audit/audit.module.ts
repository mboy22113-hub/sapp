/**
 * ===== audit.module.ts =====
 *
 * WHAT THIS FILE DOES:
 * Bundles the AuditController and AuditService.
 * Exports AuditService globally so other modules can record audit entries.
 */

import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
