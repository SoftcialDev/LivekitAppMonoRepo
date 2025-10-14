/**
 * @fileoverview ContactManagerDomainService - Domain service for contact manager operations
 * @description Handles business logic for contact manager creation and management
 */

import { ContactManagerStatus, UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { ContactManagerProfile } from '../entities/ContactManagerProfile';
import { CreateContactManagerRequest } from '../value-objects/CreateContactManagerRequest';
import { DeleteContactManagerRequest } from '../value-objects/DeleteContactManagerRequest';
import { ContactManagerListResponse } from '../value-objects/ContactManagerListResponse';
import { ContactManagerStatusResponse } from '../value-objects/ContactManagerStatusResponse';
import { UpdateContactManagerStatusRequest } from '../value-objects/UpdateContactManagerStatusRequest';
/**
 * Domain service for contact manager operations.
 */
export class ContactManagerDomainService {
  constructor(
    private userRepository: IUserRepository
  ) {}

  /**
   * Creates a new contact manager by promoting a user.
   * @param request - The contact manager creation request
   * @returns Promise that resolves to the created contact manager profile
   */
  async createContactManager(request: CreateContactManagerRequest): Promise<ContactManagerProfile> {
    const normalizedEmail = request.email.toLowerCase();

    let user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new Error(`User with email "${normalizedEmail}" not found in database`);
    }

    // Simply change the user role to ContactManager (no Graph API operations)
    await this.userRepository.changeUserRole(user.id, UserRole.ContactManager);

    const profile = await this.createContactManagerProfile(user.id, request.status);

        await this.logInitialStatusChange(profile.id, request.status, user.id);

    return profile;
  }


  private async createContactManagerProfile(userId: string, status: ContactManagerStatus): Promise<ContactManagerProfile> {
    return await this.userRepository.createContactManagerProfile(userId, status);
  }

  private async logInitialStatusChange(profileId: string, status: ContactManagerStatus, userId: string): Promise<void> {
    await this.userRepository.createContactManagerStatusHistory({
      profileId,
      previousStatus: status,
      newStatus: status,
      changedById: userId
    });
  }

  /**
   * Deletes a Contact Manager by revoking their role and removing their profile.
   * @param request - The Contact Manager deletion request
   * @returns Promise that resolves when deletion is complete
   */
  async deleteContactManager(request: DeleteContactManagerRequest): Promise<void> {
    const profile = await this.userRepository.findContactManagerProfile(request.profileId);

    if (!profile) {
      throw new Error(`Contact Manager profile "${request.profileId}" not found`);
    }

    // Change user role to Unassigned (soft delete)
    await this.userRepository.changeUserRole(profile.userId, UserRole.Unassigned);

    // Delete the Contact Manager profile
    await this.userRepository.deleteContactManagerProfile(request.profileId);

    // Log the deletion
    await this.logContactManagerDeletion(request.profileId, profile.userId);
  }

  /**
   * Logs Contact Manager deletion for audit purposes.
   * @param profileId - Profile ID
   * @param userId - User ID
   * @returns Promise that resolves when log is created
   */
  private async logContactManagerDeletion(profileId: string, userId: string): Promise<void> {
    await this.userRepository.createContactManagerAuditLog({
      profileId,
      action: 'DELETED',
      changedById: userId
    });
  }

  /**
   * Lists all Contact Managers.
   * @returns Promise that resolves to the list of Contact Managers
   */
  async listContactManagers(): Promise<ContactManagerListResponse> {
    const profiles = await this.userRepository.findAllContactManagers();
    return ContactManagerListResponse.fromProfiles(profiles);
  }

  /**
   * Gets the current Contact Manager's status.
   * @param userId - User ID
   * @returns Promise that resolves to the Contact Manager status
   */
  async getMyContactManagerStatus(userId: string): Promise<ContactManagerStatusResponse> {
    const profile = await this.userRepository.findContactManagerProfileByUserId(userId);

    if (!profile) {
      throw new Error(`Contact Manager profile for user "${userId}" not found`);
    }

    return ContactManagerStatusResponse.fromProfile(profile);
  }

  /**
   * Updates the current Contact Manager's status.
   * @param userId - User ID
   * @param request - The status update request
   * @returns Promise that resolves to the updated Contact Manager status
   */
  async updateMyContactManagerStatus(userId: string, request: UpdateContactManagerStatusRequest): Promise<ContactManagerStatusResponse> {
    const profile = await this.userRepository.findContactManagerProfileByUserId(userId);

    if (!profile) {
      throw new Error(`Contact Manager profile for user "${userId}" not found`);
    }

    // Update the status
    await this.userRepository.updateContactManagerStatus(profile.id, request.status);

    // Log the status change
    await this.logStatusChange(profile.id, profile.status, request.status, userId);

    // Return updated profile
    const updatedProfile = await this.userRepository.findContactManagerProfileByUserId(userId);
    return ContactManagerStatusResponse.fromProfile(updatedProfile!);
  }

  /**
   * Logs Contact Manager status change for audit purposes.
   * @param profileId - Profile ID
   * @param previousStatus - Previous status
   * @param newStatus - New status
   * @param userId - User ID
   * @returns Promise that resolves when log is created
   */
  private async logStatusChange(profileId: string, previousStatus: ContactManagerStatus, newStatus: ContactManagerStatus, userId: string): Promise<void> {
    await this.userRepository.createContactManagerStatusHistory({
      profileId,
      previousStatus,
      newStatus,
      changedById: userId
    });
  }
}
