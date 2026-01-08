/**
 * @fileoverview ContactManagerApplicationService - Application service for contact manager operations
 * @description Orchestrates contact manager creation with authorization
 */

import { ContactManagerDomainService } from '../../domain/services';
import { AuthorizationService } from '../../domain/services';
import { CreateContactManagerRequest } from '../../domain/value-objects/CreateContactManagerRequest';
import { DeleteContactManagerRequest } from '../../domain/value-objects/DeleteContactManagerRequest';  
import { ContactManagerListResponse } from '../../domain/value-objects';
import { ContactManagerStatusResponse } from '../../domain/value-objects/ContactManagerStatusResponse';
import { UpdateContactManagerStatusRequest } from '../../domain/value-objects/UpdateContactManagerStatusRequest';
import { ContactManagerProfile } from '../../domain/entities/ContactManagerProfile';

/**
 * Application service for contact manager operations.
 */
export class ContactManagerApplicationService {
  constructor(
    private contactManagerDomainService: ContactManagerDomainService,
    private authorizationService: AuthorizationService
  ) {}

  /**
   * Creates a new contact manager.
   * @param request - The contact manager creation request
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves to the created contact manager profile
   */
  async createContactManager(
    request: CreateContactManagerRequest,
    callerId: string
  ): Promise<ContactManagerProfile> {
    // Permission check is done at middleware level
    return await this.contactManagerDomainService.createContactManager(request);
  }

  /**
   * Deletes a contact manager.
   * @param request - The contact manager deletion request
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves when deletion is complete
   */
  async deleteContactManager(
    request: DeleteContactManagerRequest,
    callerId: string
  ): Promise<void> {
    // Permission check is done at middleware level
    await this.contactManagerDomainService.deleteContactManager(request);
  }

  /**
   * Lists contact managers with proper authorization.
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves to the list of contact managers
   */
  async listContactManagers(callerId: string): Promise<ContactManagerListResponse> {
    // Any authenticated user can access this endpoint
    return await this.contactManagerDomainService.listContactManagers();
  }

  /**
   * Gets the current contact manager's status with proper authorization.
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves to the contact manager status
   */
  async getMyContactManagerStatus(callerId: string): Promise<ContactManagerStatusResponse> {
    await this.authorizationService.canAccessContactManager(callerId);
    
    return await this.contactManagerDomainService.getMyContactManagerStatus(callerId);
  }

  /**
   * Updates the current contact manager's status with proper authorization.
   * @param request - The status update request
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves to the updated contact manager status
   */
  async updateMyContactManagerStatus(
    request: UpdateContactManagerStatusRequest,
    callerId: string
  ): Promise<ContactManagerStatusResponse> {
    await this.authorizationService.canAccessContactManager(callerId);
    
    return await this.contactManagerDomainService.updateMyContactManagerStatus(callerId, request);
  }
}
