/**
 * ===== users.controller.ts =====
 *
 * WHAT THIS FILE DOES:
 * Exposes REST endpoints for user profile management and user administration.
 *
 * ENDPOINTS:
 * - GET   /profile          → Returns the currently authenticated user's profile.
 * - PATCH /profile          → Updates the caller's full_name and/or department.
 * - GET   /users            → Lists all users in the system (ADMIN only).
 * - PATCH /users/:id/role   → Changes a user's role (ADMIN only).
 *
 * IMPORTANT GUARDS & DECORATORS:
 * - `@UseGuards(AuthGuard, RolesGuard)` → Protects all endpoints.
 * - `@CurrentUser('id')` → Injects the authenticated user ID without trusting request body.
 * - `@Roles(Role.ADMIN)` → Restricts administrative endpoints to ADMIN users.
 *
 * DATA FLOW:
 * HTTP Request
 *   ↓
 * AuthGuard validates JWT
 *   ↓
 * RolesGuard checks permissions
 *   ↓
 * Controller method extracts parameters/DTO
 *   ↓
 * UsersService performs DB operation
 *   ↓
 * Response returned to client
 *
 * WHERE TO MODIFY LATER:
 * - If you want user deactivation, pagination for users list, or user avatar uploads.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Users & Profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile (full name, department)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('users')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all user profiles' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Patch('users/:id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Update a user's role (Admin only)" })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, dto.role);
  }
}
