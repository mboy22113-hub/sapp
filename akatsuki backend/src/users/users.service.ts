/**
 * ===== users.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Encapsulates all database operations on the `profiles` table.
 * It handles fetching the current user's profile, updating profile details,
 * and admin actions like listing all users or updating roles.
 *
 * IMPORTANT FUNCTIONS:
 * - getProfile(userId)         → Returns profile row for a specific user.
 * - updateProfile(userId, dto) → Updates full_name and/or department for the current user.
 * - getAllUsers()              → Lists all user profiles in the system (Admin only).
 * - updateUserRole(userId, role) → Updates the assigned role for a user (Admin only).
 *
 * DATA FLOW:
 * Controller calls method with validated DTO
 *   ↓
 * UsersService gets Supabase client (service role)
 *   ↓
 * Runs PostgREST query on `profiles` table
 *   ↓
 * Handles any errors (e.g. user not found)
 *   ↓
 * Returns clean profile data back to Controller
 *
 * WHERE TO MODIFY LATER:
 * - If you want to automatically sync newly registered users or send email notifications
 *   when a role changes, add that logic here.
 */

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Fetch the profile for a given user ID.
   */
  async getProfile(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, department, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`User profile for ID ${userId} not found.`);
    }

    return data;
  }

  /**
   * Update the calling user's own profile (full_name, department).
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const supabase = this.supabaseService.getClient();

    const updatePayload: Record<string, any> = {};
    if (dto.full_name !== undefined) updatePayload.full_name = dto.full_name;
    if (dto.department !== undefined) updatePayload.department = dto.department;

    if (Object.keys(updatePayload).length === 0) {
      return this.getProfile(userId);
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, full_name, role, department, updated_at')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update profile: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * List all user profiles (Admin only).
   */
  async getAllUsers() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, department, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve users: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Change a user's role (Admin only).
   */
  async updateUserRole(targetUserId: string, newRole: Role) {
    const supabase = this.supabaseService.getClient();

    // Verify user exists
    await this.getProfile(targetUserId);

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select('id, email, full_name, role, department, updated_at')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update role: ${error.message}`,
      );
    }

    return data;
  }
}
