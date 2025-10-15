/**
 * @fileoverview ContactManagerFormService - Domain service for contact manager form operations
 * @description Handles business logic for contact manager form processing
 */

import { IContactManagerFormService } from '../interfaces/IContactManagerFormService';
import { IContactManagerFormRepository } from '../interfaces/IContactManagerFormRepository';
import { IBlobStorageService } from '../interfaces/IBlobStorageService';
import { IChatService } from '../interfaces/IChatService';
import { ContactManagerFormRequest } from '../value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../value-objects/ContactManagerFormResult';
import { ImageUploadRequest } from '../value-objects/ImageUploadRequest';
import { FormType } from '../enums/FormType';

/**
 * Domain service for contact manager form operations
 */
export class ContactManagerFormService implements IContactManagerFormService {
  constructor(
    private formRepository: IContactManagerFormRepository,
    private blobStorageService: IBlobStorageService,
    private chatService: IChatService
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
    token: string,
    senderName: string
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

      // 3. Send notification to chat (async, don't wait for completion)
      this.sendNotificationAsync(request, imageUrl, token, senderName);

      return ContactManagerFormResult.fromFormCreation(formId, true, imageUrl);
    } catch (error: any) {
      throw new Error(`Failed to process contact manager form: ${error.message}`);
    }
  }

  /**
   * Sends notification to chat asynchronously using admin token
   * @param request - Contact manager form request
   * @param imageUrl - Optional image URL
   * @param token - Authentication token from admin user
   * @param senderName - Name of the user submitting the form
   */
  private async sendNotificationAsync(
    request: ContactManagerFormRequest,
    imageUrl: string | undefined,
    token: string,
    senderName: string
  ): Promise<void> {
    try {
      // Get or sync chat using admin token
      const chatId = await this.chatService.getOrSyncChat(token);

      // Create message payload
      const message = {
        subject: this.getSubjectForFormType(request.formType),
        senderName,
        formType: request.formType,
        data: request.getFormDataForStorage(),
        imageUrl
      };

      // Send message using admin token
      await this.chatService.sendMessage(token, chatId, message);
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Gets the subject for the form type
   * @param formType - Type of the form
   * @returns Subject string for the form
   */
  private getSubjectForFormType(formType: FormType): string {
    const subjectMap: Record<FormType, string> = {
      [FormType.DISCONNECTIONS]: '🚨 Disconnections Report',
      [FormType.ADMISSIONS]: '🏥 Admissions Report',
      [FormType.ASSISTANCE]: '⚕️ Acute Assessment Report'
    };

    return subjectMap[formType];
  }
}
