/**
 * @fileoverview IContactManagerFormService - Interface for contact manager form operations
 * @description Defines the contract for contact manager form domain services
 */

import { ContactManagerFormRequest } from '../value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../value-objects/ContactManagerFormResult';

/**
 * Interface for contact manager form domain service
 */
export interface IContactManagerFormService {
  /**
   * Processes a contact manager form submission
   * @param request - Contact manager form request
   * @param senderId - ID of the user submitting the form
   * @param token - Authentication token for chat notifications
   * @param senderName - Name of the user submitting the form
   * @returns Promise that resolves to form processing result
   * @throws Error if processing fails
   */
  processForm(
    request: ContactManagerFormRequest,
    senderId: string,
    senderName: string,
    senderEmail: string
  ): Promise<ContactManagerFormResult>;
}
