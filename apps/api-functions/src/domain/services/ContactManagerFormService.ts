/**
 * @fileoverview ContactManagerFormService - Domain service for contact manager form operations
 * @description Handles business logic for contact manager form processing
 */

import { IContactManagerFormService } from '../interfaces/IContactManagerFormService';
import { IContactManagerFormRepository } from '../interfaces/IContactManagerFormRepository';
import { IBlobStorageService } from '../interfaces/IBlobStorageService';
import { IChatService } from '../interfaces/IChatService';
import { IErrorLogService } from '../interfaces/IErrorLogService';
import { ContactManagerFormRequest } from '../value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../value-objects/ContactManagerFormResult';
import { ImageUploadRequest } from '../value-objects/ImageUploadRequest';
import { FormType } from '../enums/FormType';
import { ContactManagerFormProcessingError } from '../errors/ContactManagerErrors';
import { extractErrorCause, extractErrorMessage } from '../../utils/error/ErrorHelpers';

/**
 * Domain service for contact manager form operations
 */
export class ContactManagerFormService implements IContactManagerFormService {
  constructor(
    private formRepository: IContactManagerFormRepository,
    private blobStorageService: IBlobStorageService,
    private chatService: IChatService,
    private errorLogService: IErrorLogService
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

      // 3. Send notification to chat (async, don't wait for completion)
      void this.sendNotificationAsync(request, imageUrl, senderName, senderEmail, senderId, formId);

      return ContactManagerFormResult.fromFormCreation(formId, true, imageUrl);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      const errorCause = extractErrorCause(error);
      throw new ContactManagerFormProcessingError(`Failed to process contact manager form: ${errorMessage}`, errorCause);
    }
  }

  /**
   * Sends notification to chat asynchronously using admin token
   * @param request - Contact manager form request
   * @param imageUrl - Optional image URL
   * @param senderName - Name of the user submitting the form
   * @param senderEmail - Email of the user submitting the form
   * @param senderId - ID of the user submitting the form
   * @param formId - ID of the created form
   */
  private async sendNotificationAsync(
    request: ContactManagerFormRequest,
    imageUrl: string | undefined,
    senderName: string,
    senderEmail: string,
    senderId: string,
    formId: string
  ): Promise<void> {
    let chatId: string | undefined;
    try {
      // Get or sync chat using application credentials
      chatId = await this.chatService.getContactManagersChatId();

      // Create message payload
      const safeSenderEmail = senderEmail?.trim() || 'Not provided';

      const message = {
        type: 'contactManagerForm',
        subject: this.getSubjectForFormType(request.formType),
        senderName,
        senderEmail: safeSenderEmail,
        formType: request.formType,
        data: request.getFormDataForStorage(),
        imageUrl
      };

      // Send message using application identity
      await this.chatService.sendMessageAsApp(chatId, message);
    } catch (error) {
      try {
        await this.errorLogService.logChatServiceError({
          endpoint: 'ContactManagersForm',
          functionName: 'sendNotificationAsync',
          error,
          userId: senderId,
          userEmail: senderEmail,
          chatId,
          context: {
            formType: request.formType,
            formId,
            senderEmail
          }
        });
      } catch {
        // Failed to persist error log
      }
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
