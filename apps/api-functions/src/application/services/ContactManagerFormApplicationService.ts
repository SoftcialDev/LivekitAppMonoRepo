/**
 * @fileoverview ContactManagerFormApplicationService - Application service for contact manager form operations
 * @description Orchestrates contact manager form operations with authorization
 */

import { IContactManagerFormService } from '../../domain/interfaces/IContactManagerFormService';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ContactManagerFormRequest } from '../../domain/value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../../domain/value-objects/ContactManagerFormResult';
import { UserNotFoundError } from '../../domain/errors/UserErrors';

/**
 * Application service for contact manager form operations
 */
export class ContactManagerFormApplicationService {
  constructor(
    private readonly contactManagerFormService: IContactManagerFormService,
    private readonly authorizationService: IAuthorizationService,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Processes a contact manager form submission
   * @param request - Contact manager form request
   * @param callerId - ID of the user making the request
   * @returns Promise that resolves to form processing result
   * @throws Error if processing fails
   */
  async processForm(
    request: ContactManagerFormRequest,
    callerId: string
  ): Promise<ContactManagerFormResult> {
    // Permission check is done at middleware level
    // Get user information
    const user = await this.userRepository.findByAzureAdObjectId(callerId);
    if (!user) {
      throw new UserNotFoundError('User not found');
    }

    // Execute the domain service with user token
    return await this.contactManagerFormService.processForm(
      request,
      user.id,
      user.fullName,
      user.email
    );
  }

}
