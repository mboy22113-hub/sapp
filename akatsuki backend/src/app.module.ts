/**
 * ===== app.module.ts =====
 *
 * WHAT THIS FILE DOES:
 * This is the ROOT MODULE of the entire NestJS application.
 * Think of it as the "table of contents" — it lists every module the app uses.
 *
 * HOW IT WORKS:
 * - ConfigModule.forRoot() loads environment variables from .env
 * - ThrottlerModule sets up rate limiting (prevents abuse)
 * - SupabaseModule provides the database/auth/storage client
 * - AppController handles the /health endpoint
 *
 * WHERE TO MODIFY LATER:
 * - When you create a new module (e.g., InspectionsModule), import it here
 * - Each new "import" adds that module's controllers and services to the app
 *
 * DATA FLOW:
 * 1. main.ts creates the app using this module
 * 2. NestJS reads the imports array and initializes each module
 * 3. All controllers from all modules become available as API endpoints
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { InspectionsModule } from './inspections/inspections.module';
import { FindingsModule } from './findings/findings.module';
import { EvidenceModule } from './evidence/evidence.module';
import { CorrectiveActionsModule } from './corrective-actions/corrective-actions.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Load .env file into process.env and make ConfigService available
    ConfigModule.forRoot({
      isGlobal: true, // Available everywhere without importing
    }),

    // Rate limiting — prevents brute-force attacks
    // Default: 10 requests per 60 seconds per IP
    // You can override per-endpoint later with @Throttle()
    ThrottlerModule.forRoot([{
      ttl: 60000,   // Time window in milliseconds (60 seconds)
      limit: 60,    // Max requests per window (generous for development)
    }]),

    // Supabase client — global, available to all modules
    SupabaseModule,

    // Authentication & RBAC
    AuthModule,

    // Users and profiles
    UsersModule,

    // Checklists and items
    ChecklistsModule,

    // Inspections and responses
    InspectionsModule,

    // Findings and risk calculation
    FindingsModule,

    // Evidence and file storage
    EvidenceModule,

    // Corrective actions & verification state machine
    CorrectiveActionsModule,

    // Audit trail logging
    AuditModule,

    // Dashboard metrics and compliance analytics
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
