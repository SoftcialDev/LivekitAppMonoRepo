/**
 * @fileoverview SuperAdminDomainService - Domain service for Super Admin operations
 * @description Handles business logic for Super Admin creation and management
 */

import { UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { SuperAdminProfile } from '../entities/SuperAdminProfile';
import { CreateSuperAdminRequest } from '../value-objects/CreateSuperAdminRequest';
import { DeleteSuperAdminRequest } from '../value-objects/DeleteSuperAdminRequest';
import { SuperAdminListResponse } from '../value-objects/SuperAdminListResponse';
import { SuperAdminUserNotFoundError, SuperAdminInvalidRoleError } from '../errors/SuperAdminErrors';

/**
 * Domain service for Super Admin operations.
 */
export class SuperAdminDomainService {
  constructor(
    private userRepository: IUserRepository
  ) {}

  /**
   * Creates a new Super Admin by promoting a user.
   * @param request - The Super Admin creation request
   * @returns Promise that resolves to the created Super Admin profile
   */
  async createSuperAdmin(request: CreateSuperAdminRequest): Promise<SuperAdminProfile> {
    const normalizedEmail = request.email.toLowerCase();

    let user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new SuperAdminUserNotFoundError(`User with email "${normalizedEmail}" not found in database`);
    }

    // Simply change the user role to SuperAdmin (no Graph API operations)
    await this.userRepository.changeUserRole(user.id, UserRole.SuperAdmin);

    // Log the SuperAdmin creation
    await this.logSuperAdminCreation(user.id, user.id);

    // Return a simple profile (no database table needed)
    return new SuperAdminProfile(
      `superadmin-${user.id}`,
      user.id,
      new Date(),
      new Date()
    );
  }


  /**
   * Logs Super Admin creation for audit purposes.
   * @param userId - User ID
   * @param createdById - ID of the user who created the Super Admin
   * @returns Promise that resolves when log is created
   */
  private async logSuperAdminCreation(userId: string, createdById: string): Promise<void> {
    await this.userRepository.createSuperAdminAuditLog({
      profileId: `superadmin-${userId}`,
      action: 'CREATED',
      changedById: createdById
    });
  }

  /**
   * Deletes a Super Admin by revoking their role.
   * @param request - The Super Admin deletion request
   * @returns Promise that resolves when deletion is complete
   */
  async deleteSuperAdmin(request: DeleteSuperAdminRequest): Promise<void> {
    let user;

    // Handle both composite ID (superadmin-{uuid}) and direct Azure AD Object ID
    if (request.userId.startsWith('superadmin-')) {
      // Extract the actual user ID from the composite ID
      const actualUserId = request.userId.replace('superadmin-', '');
      
      user = await this.userRepository.findById(actualUserId);
      
      if (!user) {
        user = await this.userRepository.findByAzureAdObjectId(actualUserId);
      }
    
      // 3. If still not found, try by email (last resort)
      if (!user) {
        const allSuperAdmins = await this.userRepository.findAllSuperAdmins();
        const matchingProfile = allSuperAdmins.find(profile => 
          profile.userId === actualUserId || profile.id === actualUserId
        );
        
        if (matchingProfile && matchingProfile.user?.email) {
          user = await this.userRepository.findByEmail(matchingProfile.user.email);
        }
      }
      
      // 4. If still not found, try to find by any field that matches
      if (!user) {
        // Try to find by any field that might match
        const allUsers = await this.userRepository.findAllUsers();
        const matchingUser = allUsers.find(u => 
          u.id === actualUserId || 
          u.azureAdObjectId === actualUserId ||
          u.email === actualUserId
        );
        
        if (matchingUser) {
          user = matchingUser;
        }
      }
    } else {
      // Try multiple strategies: database ID, Azure AD Object ID, or email
      user = await this.userRepository.findById(request.userId);
      
      if (!user) {
        user = await this.userRepository.findByAzureAdObjectId(request.userId);
      }
      
      if (!user) {
        user = await this.userRepository.findByEmail(request.userId);
      }
    }

    if (!user) {
      throw new SuperAdminUserNotFoundError(`User "${request.userId}" not found`);
    }

    if (user.role !== UserRole.SuperAdmin) {
      throw new SuperAdminInvalidRoleError(`User "${request.userId}" is not a Super Admin`);
    }

    // Change user role to Unassigned (soft delete)
    await this.userRepository.changeUserRole(user.id, UserRole.Unassigned);

    // Log the deletion
    await this.logSuperAdminDeletion(user.id, user.id);
  }

  /**
   * Logs Super Admin deletion for audit purposes.
   * @param userId - User ID
   * @param deletedById - ID of the user who deleted the Super Admin
   * @returns Promise that resolves when log is created
   */
  private async logSuperAdminDeletion(userId: string, deletedById: string): Promise<void> {
    await this.userRepository.createSuperAdminAuditLog({
      profileId: `superadmin-${userId}`,
      action: 'DELETED',
      changedById: deletedById
    });
  }

  /**
   * Lists all Super Admins.
   * @returns Promise that resolves to the list of Super Admins
   */
  async listSuperAdmins(): Promise<SuperAdminListResponse> {
    const profiles = await this.userRepository.findAllSuperAdmins();
    return SuperAdminListResponse.fromProfiles(profiles);
  }
}
