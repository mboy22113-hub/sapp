/**
 * ===== evidence.module.ts =====
 *
 * WHAT THIS FILE DOES:
 * Bundles the EvidenceController and EvidenceService.
 */

import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
