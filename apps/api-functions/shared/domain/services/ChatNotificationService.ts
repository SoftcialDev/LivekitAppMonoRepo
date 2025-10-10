/**
 * @fileoverview ChatNotificationService - Domain service for chat notification operations
 * @description Handles business logic for chat notifications
 */

import { IChatService } from '../interfaces/IChatService';
import { ContactManagerFormRequest } from '../value-objects/ContactManagerFormRequest';
import { FormType } from '../enums/FormType';

export interface ChatMessage {
  subject: string;
  senderName: string;
  formType: FormType;
  data: Record<string, any>;
  imageUrl?: string;
}

/**
 * Domain service for chat notification operations
 */
export class ChatNotificationService {
  constructor(private chatService: IChatService) {}

  /**
   * Sends a notification to the contact managers chat
   * @param token - Authentication token
   * @param request - Contact manager form request
   * @param senderName - Name of the sender
   * @param imageUrl - Optional image URL
   * @returns Promise that resolves when notification is sent
   * @throws Error if notification fails
   */
  async sendNotification(
    token: string,
    request: ContactManagerFormRequest,
    senderName: string,
    imageUrl?: string
  ): Promise<void> {
    try {
      // Get or sync chat
      const chatId = await this.chatService.getOrSyncChat(token);

      // Create message
      const message: ChatMessage = {
        subject: this.getSubjectForFormType(request.formType),
        senderName,
        formType: request.formType,
        data: request.getFormDataForStorage(),
        imageUrl
      };

      // Send message
      await this.chatService.sendMessage(token, chatId, message);
    } catch (error: any) {
      throw new Error(`Failed to send chat notification: ${error.message}`);
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
