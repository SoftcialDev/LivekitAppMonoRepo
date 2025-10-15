/**
 * @fileoverview ContactManagerDomainService - Domain service for contact manager operations
 * @description Handles business logic for contact manager creation and management
 */

import { ContactManagerStatus, UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IWebPubSubService } from '../interfaces/IWebPubSubService';
import { getCentralAmericaTime } from '../../utils/dateUtils';
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
    private userRepository: IUserRepository,
    private webPubSubService: IWebPubSubService
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
   * @param azureAdObjectId - Azure AD Object ID
   * @returns Promise that resolves to the Contact Manager status
   */
  async getMyContactManagerStatus(azureAdObjectId: string): Promise<ContactManagerStatusResponse> {
    // First find the user by Azure AD Object ID
    const user = await this.userRepository.findByAzureAdObjectId(azureAdObjectId);
    
    if (!user) {
      throw new Error(`User with Azure AD Object ID "${azureAdObjectId}" not found`);
    }

    const profile = await this.userRepository.findContactManagerProfileByUserId(user.id);

    if (!profile) {
      throw new Error(`Contact Manager profile for user "${user.email}" not found`);
    }

    return ContactManagerStatusResponse.fromProfile(profile);
  }

  /**
   * Updates the current Contact Manager's status.
   * @param azureAdObjectId - Azure AD Object ID
   * @param request - The status update request
   * @returns Promise that resolves to the updated Contact Manager status
   */
  async updateMyContactManagerStatus(azureAdObjectId: string, request: UpdateContactManagerStatusRequest): Promise<ContactManagerStatusResponse> {
    // First find the user by Azure AD Object ID
    const user = await this.userRepository.findByAzureAdObjectId(azureAdObjectId);
    
    if (!user) {
      throw new Error(`User with Azure AD Object ID "${azureAdObjectId}" not found`);
    }

    const profile = await this.userRepository.findContactManagerProfileByUserId(user.id);

    if (!profile) {
      throw new Error(`Contact Manager profile for user "${user.email}" not found`);
    }

    // Update the status
    await this.userRepository.updateContactManagerStatus(profile.id, request.status);

    // Log the status change
    await this.logStatusChange(profile.id, profile.status, request.status, user.id);

    // Broadcast status change to PSOs via WebSocket
    await this.broadcastContactManagerStatusChange(user.email, user.fullName, request.status);

    // Return updated profile
    const updatedProfile = await this.userRepository.findContactManagerProfileByUserId(user.id);
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

  /**
   * Broadcasts Contact Manager status change to PSOs via WebSocket.
   * @param email - Contact Manager email
   * @param fullName - Contact Manager full name
   * @param status - New status (Available, Unavailable, OnBreak, OnAnotherTask)
   * @returns Promise that resolves when broadcast is complete
   */
  private async broadcastContactManagerStatusChange(email: string, fullName: string, status: ContactManagerStatus): Promise<void> {
    try {
      // Create a message that matches the frontend ContactManagerStatusUpdate interface
      const message = {
        managerId: email, // Use email as managerId for identification
        status: status, // ✅ Envía el estado real: Available, Unavailable, OnBreak, OnAnotherTask
        updatedAt: getCentralAmericaTime().toISOString(),
        channel: 'cm-status-updates'
      };

      // Send custom message to 'cm-status-updates' group so PSOs receive the notification
      await this.webPubSubService.broadcastMessage('cm-status-updates', message);
      
      console.log(`[ContactManagerDomainService] Broadcasted Contact Manager status change for ${email}: ${status}`);
    } catch (error: any) {
      console.error(`[ContactManagerDomainService] Failed to broadcast status change: ${error.message}`);
      // Don't throw error - WebSocket failure shouldn't break the status update
    }
  }
}
