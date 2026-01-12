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
    private readonly userRepository: IUserRepository
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
   * Finds user by composite ID (superadmin-{uuid})
   * @param actualUserId - User ID extracted from composite ID
   * @returns User if found, null otherwise
   */
  private async findUserByCompositeId(actualUserId: string) {
    let user = await this.userRepository.findById(actualUserId);
    if (user) return user;

    user = await this.userRepository.findByAzureAdObjectId(actualUserId);
    if (user) return user;

    const allSuperAdmins = await this.userRepository.findAllSuperAdmins();
    const matchingProfile = allSuperAdmins.find(profile => 
      profile.userId === actualUserId || profile.id === actualUserId
    );
    
    if (matchingProfile?.user?.email) {
      user = await this.userRepository.findByEmail(matchingProfile.user.email);
      if (user) return user;
    }

    const allUsers = await this.userRepository.findAllUsers();
    const matchingUser = allUsers.find(u => 
      u.id === actualUserId || 
      u.azureAdObjectId === actualUserId ||
      u.email === actualUserId
    );
    
    return matchingUser ?? null;
  }

  /**
   * Finds user by direct ID (database ID, Azure AD Object ID, or email)
   * @param userId - User identifier
   * @returns User if found, null otherwise
   */
  private async findUserByDirectId(userId: string) {
    let user = await this.userRepository.findById(userId);
    if (user) return user;

    user = await this.userRepository.findByAzureAdObjectId(userId);
    if (user) return user;

    return await this.userRepository.findByEmail(userId);
  }

  /**
   * Validates that user exists and is a Super Admin
   * @param user - User to validate
   * @param requestUserId - Original request user ID for error messages
   * @throws SuperAdminUserNotFoundError if user is null
   * @throws SuperAdminInvalidRoleError if user is not a Super Admin
   * @returns The validated user (type guard ensures it's not null)
   */
  private validateSuperAdminUser(
    user: { id: string; role: UserRole } | null, 
    requestUserId: string
  ): user is { id: string; role: UserRole } {
    if (!user) {
      throw new SuperAdminUserNotFoundError(`User "${requestUserId}" not found`);
    }

    if (user.role !== UserRole.SuperAdmin) {
      throw new SuperAdminInvalidRoleError(`User "${requestUserId}" is not a Super Admin`);
    }

    return true;
  }

  /**
   * Deletes a Super Admin by revoking their role.
   * @param request - The Super Admin deletion request
   * @returns Promise that resolves when deletion is complete
   */
  async deleteSuperAdmin(request: DeleteSuperAdminRequest): Promise<void> {
    const isCompositeId = request.userId.startsWith('superadmin-');
    const userId = isCompositeId ? request.userId.replace('superadmin-', '') : request.userId;
    
    const user = isCompositeId 
      ? await this.findUserByCompositeId(userId)
      : await this.findUserByDirectId(userId);

    if (!this.validateSuperAdminUser(user, request.userId)) {
      return; // This should never happen due to exception, but satisfies type checker
    }

    await this.userRepository.changeUserRole(user.id, UserRole.Unassigned);
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
