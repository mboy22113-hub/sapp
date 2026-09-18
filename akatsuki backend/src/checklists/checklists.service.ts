/**
 * ===== checklists.service.ts =====
 *
 * WHAT THIS FILE DOES:
 * Handles CRUD operations on the `checklists` and `checklist_items` tables.
 *
 * IMPORTANT FUNCTIONS:
 * - createChecklist(userId, dto)       → Creates a new checklist template authored by the user.
 * - findAllChecklists()                → Returns all checklist templates.
 * - findChecklistById(id)              → Returns a checklist together with all its items (sorted).
 * - updateChecklist(id, dto)           → Updates title or description of a checklist.
 * - deleteChecklist(id)                → Deletes a checklist (and cascading items).
 * - addItemToChecklist(checklistId, dto) → Adds a new question item to a checklist.
 * - findItemsByChecklist(checklistId)  → Returns all question items for a checklist.
 * - updateChecklistItem(itemId, dto)   → Modifies an existing checklist item.
 * - deleteChecklistItem(itemId)        → Removes an item from a checklist.
 *
 * DATA FLOW:
 * Admin / Inspector requests checklist operations
 *   ↓
 * Service talks to PostgreSQL via Supabase Service Client
 *   ↓
 * Returns checklist model or throws NotFound / InternalServerError
 *
 * WHERE TO MODIFY LATER:
 * - Add soft deletion (`is_active` flag) instead of hard DELETE.
 * - Add checklist cloning or template versioning.
 */

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Injectable()
export class ChecklistsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create a new checklist template.
   */
  async createChecklist(userId: string, dto: CreateChecklistDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('checklists')
      .insert({
        name: dto.name,
        description: dto.description || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create checklist: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * List all checklist templates.
   */
  async findAllChecklists() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('checklists')
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at,
        creator:profiles(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch checklists: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Fetch a single checklist and include its items in order.
   */
  async findChecklistById(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at,
        creator:profiles(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (checklistError || !checklist) {
      throw new NotFoundException(`Checklist with ID ${id} not found.`);
    }

    const { data: items, error: itemsError } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw new InternalServerErrorException(
        `Failed to fetch checklist items: ${itemsError.message}`,
      );
    }

    return {
      ...checklist,
      items: items || [],
    };
  }

  /**
   * Update an existing checklist template.
   */
  async updateChecklist(id: string, dto: UpdateChecklistDto) {
    const supabase = this.supabaseService.getClient();

    // Verify existence
    await this.findChecklistById(id);

    const updatePayload: Record<string, any> = {};
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.description !== undefined) updatePayload.description = dto.description;

    const { data, error } = await supabase
      .from('checklists')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update checklist: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Delete a checklist (cascade deletes associated checklist items).
   */
  async deleteChecklist(id: string) {
    const supabase = this.supabaseService.getClient();

    // Verify existence
    await this.findChecklistById(id);

    const { error } = await supabase.from('checklists').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete checklist: ${error.message}`,
      );
    }

    return { message: `Checklist ${id} successfully deleted.` };
  }

  /**
   * Add a question item to a checklist.
   */
  async addItemToChecklist(checklistId: string, dto: CreateChecklistItemDto) {
    const supabase = this.supabaseService.getClient();

    // Ensure parent checklist exists
    await this.findChecklistById(checklistId);

    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        checklist_id: checklistId,
        question: dto.question,
        description: dto.description || null,
        category: dto.category || null,
        sort_order: dto.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to add item to checklist: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * List all items for a checklist.
   */
  async findItemsByChecklist(checklistId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify checklist exists
    await this.findChecklistById(checklistId);

    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch items: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Update a specific checklist question item.
   */
  async updateChecklistItem(itemId: string, dto: UpdateChecklistItemDto) {
    const supabase = this.supabaseService.getClient();

    const updatePayload: Record<string, any> = {};
    if (dto.question !== undefined) updatePayload.question = dto.question;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.category !== undefined) updatePayload.category = dto.category;
    if (dto.sort_order !== undefined) updatePayload.sort_order = dto.sort_order;

    const { data, error } = await supabase
      .from('checklist_items')
      .update(updatePayload)
      .eq('id', itemId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Checklist item with ID ${itemId} not found.`);
    }

    return data;
  }

  /**
   * Delete an item from a checklist.
   */
  async deleteChecklistItem(itemId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete checklist item: ${error.message}`,
      );
    }

    return { message: `Checklist item ${itemId} successfully deleted.` };
  }
}
