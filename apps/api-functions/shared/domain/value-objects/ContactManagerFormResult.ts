/**
 * @fileoverview ContactManagerFormResult - Value object for contact manager form results
 * @description Represents the result of processing a contact manager form
 */

import { getCentralAmericaTime } from '../../utils/dateUtils';

export interface ContactManagerFormResultPayload {
  formId: string;
  messageSent: boolean;
  imageUrl?: string;
}

/**
 * Value object representing the result of processing a contact manager form
 */
export class ContactManagerFormResult {
  public readonly formId: string;
  public readonly messageSent: boolean;
  public readonly imageUrl?: string;
  public readonly timestamp: Date;

  constructor(
    formId: string,
    messageSent: boolean,
    imageUrl?: string
  ) {
    if (!formId || typeof formId !== 'string') {
      throw new Error('Form ID must be a non-empty string');
    }

    this.formId = formId;
    this.messageSent = messageSent;
    this.imageUrl = imageUrl;
    this.timestamp = getCentralAmericaTime();
  }

  /**
   * Creates a ContactManagerFormResult from form creation
   * @param formId - ID of the created form
   * @param messageSent - Whether the message was sent successfully
   * @param imageUrl - Optional image URL
   * @returns ContactManagerFormResult instance
   */
  static fromFormCreation(
    formId: string,
    messageSent: boolean,
    imageUrl?: string
  ): ContactManagerFormResult {
    return new ContactManagerFormResult(formId, messageSent, imageUrl);
  }

  /**
   * Converts to payload format for API response
   * @returns Payload representation
   */
  toPayload(): ContactManagerFormResultPayload {
    return {
      formId: this.formId,
      messageSent: this.messageSent,
      imageUrl: this.imageUrl
    };
  }
}
