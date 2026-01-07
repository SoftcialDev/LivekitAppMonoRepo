/**
 * @fileoverview ContactManagerFormApplicationService - Application service for contact manager form operations
 * @description Orchestrates contact manager form operations with authorization
 */

import { IContactManagerFormService } from '../../index';
import { IAuthorizationService } from '../../index';
import { IUserRepository } from '../../index';
import { ContactManagerFormRequest } from '../../index';
import { ContactManagerFormResult } from '../../index';
import { UserNotFoundError } from '../../index';

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
