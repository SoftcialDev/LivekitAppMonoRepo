/**
 * @fileoverview ContactManagerFormService - Domain service for contact manager form operations
 * @description Handles business logic for contact manager form processing
 */

import { IContactManagerFormService } from '../interfaces/IContactManagerFormService';
import { IContactManagerFormRepository } from '../interfaces/IContactManagerFormRepository';
import { IBlobStorageService } from '../interfaces/IBlobStorageService';
import { ContactManagerFormRequest } from '../value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../value-objects/ContactManagerFormResult';
import { ImageUploadRequest } from '../value-objects/ImageUploadRequest';
import { ContactManagerFormProcessingError } from '../errors/ContactManagerErrors';
import { extractErrorCause, extractErrorMessage } from '../../utils/error/ErrorHelpers';

/**
 * Domain service for contact manager form operations
 */
export class ContactManagerFormService implements IContactManagerFormService {
  constructor(
    private readonly formRepository: IContactManagerFormRepository,
    private readonly blobStorageService: IBlobStorageService
  ) {}

  /**
   * Processes a contact manager form submission
   * @param request - Contact manager form request
   * @param senderId - ID of the user submitting the form
   * @param token - Authentication token for chat notifications
   * @param senderName - Name of the user submitting the form
   * @returns Promise that resolves to form processing result
   * @throws Error if processing fails
   */
  async processForm(
    request: ContactManagerFormRequest,
    senderId: string,
    senderName: string,
    senderEmail: string
  ): Promise<ContactManagerFormResult> {
    try {
      // 1. Process image upload if provided
      let imageUrl: string | undefined;
      if (request.imageBase64) {
        const imageRequest = new ImageUploadRequest(request.imageBase64, senderId);
        imageUrl = await this.blobStorageService.uploadImage(imageRequest);
      }

      // 2. Create form record
      const formId = await this.formRepository.createForm({
        formType: request.formType,
        senderId,
        imageUrl,
        data: request.getFormDataForStorage()
      });

      return ContactManagerFormResult.fromFormCreation(formId, true, imageUrl);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      const errorCause = extractErrorCause(error);
      throw new ContactManagerFormProcessingError(`Failed to process contact manager form: ${errorMessage}`, errorCause);
    }
  }

}
