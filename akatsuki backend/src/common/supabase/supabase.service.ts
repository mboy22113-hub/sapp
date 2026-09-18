/**
 * ===== supabase.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Creates and provides a Supabase client that the rest of the app uses
 * to talk to your Supabase project (database, auth, storage).
 *
 * IMPORTANT FUNCTIONS:
 * - getClient()       → returns a Supabase client using the SERVICE ROLE key.
 *                        This bypasses Row Level Security. Use ONLY in backend services
 *                        where you need full access (e.g., admin operations, audit logs).
 *
 * - getClientForUser(token) → returns a Supabase client using the user's JWT.
 *                              This RESPECTS Row Level Security policies.
 *                              Use for operations that should be scoped to the user.
 *
 * DATA FLOW:
 * 1. NestJS starts → ConfigService loads env vars
 * 2. SupabaseService reads SUPABASE_URL and keys from ConfigService
 * 3. Other services inject SupabaseService and call getClient() or getClientForUser()
 * 4. The returned client is used to query PostgreSQL, call Auth, or access Storage
 *
 * WHERE TO MODIFY LATER:
 * - If you need connection pooling or custom fetch options, modify createClient() calls
 * - If you add new Supabase features (Edge Functions, Realtime), add methods here
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private serviceRoleClient: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      // Don't crash the server — just warn. This lets the health check work
      // even before you set up Supabase credentials.
      console.warn(
        '⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.\n' +
        '   Copy .env.example to .env and fill in your Supabase credentials.\n' +
        '   The health check will work, but all database features will fail.\n',
      );
      return;
    }

    // Create ONE service-role client that we reuse across the app.
    // This client bypasses RLS — use it only in trusted backend code.
    this.serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Returns a Supabase client with SERVICE ROLE privileges.
   * ⚠️ This bypasses Row Level Security — use only in backend services.
   */
  getClient(): SupabaseClient {
    if (!this.serviceRoleClient) {
      throw new Error(
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.',
      );
    }
    return this.serviceRoleClient;
  }

  /**
   * Returns a Supabase client scoped to a specific user's JWT.
   * This client RESPECTS Row Level Security policies.
   * Use when the operation should be limited to what the user can access.
   */
  getClientForUser(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;

    return createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
