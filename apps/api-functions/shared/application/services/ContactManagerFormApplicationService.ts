/**
 * @fileoverview ContactManagerFormApplicationService - Application service for contact manager form operations
 * @description Orchestrates contact manager form operations with authorization
 */

import { IContactManagerFormService } from '../../domain/interfaces/IContactManagerFormService';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ContactManagerFormRequest } from '../../domain/value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../../domain/value-objects/ContactManagerFormResult';

/**
 * Application service for contact manager form operations
 */
export class ContactManagerFormApplicationService {
  constructor(
    private contactManagerFormService: IContactManagerFormService,
    private authorizationService: IAuthorizationService,
    private userRepository: IUserRepository
  ) {}

  /**
   * Processes a contact manager form submission
   * @param request - Contact manager form request
   * @param callerId - ID of the user making the request
   * @param token - Authentication token for chat notifications
   * @returns Promise that resolves to form processing result
   * @throws Error if authorization or processing fails
   */
  async processForm(
    request: ContactManagerFormRequest,
    callerId: string,
    token: string
  ): Promise<ContactManagerFormResult> {
    // 1. Authorize the operation
    await this.authorizeFormSubmission(callerId);

    // 2. Get user information
    const user = await this.userRepository.findByAzureAdObjectId(callerId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Execute the domain service with user token
    return await this.contactManagerFormService.processForm(request, user.id, token, user.fullName);
  }

  /**
   * Authorizes if a user can submit contact manager forms
   * @param callerId - Azure AD object ID of the caller
   * @throws Error if user is not authorized
   */
  private async authorizeFormSubmission(callerId: string): Promise<void> {
    // Only Employees can submit contact manager forms
    await this.authorizationService.authorizeCommandAcknowledgment(callerId);
  }

}
