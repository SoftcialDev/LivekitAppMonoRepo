/**
 * @fileoverview ContactManagerFormRequest - Value object for contact manager form requests
 * @description Represents a request to submit a contact manager form
 */

import { FormType } from '../enums/FormType';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { ValidationError } from '../errors/DomainError';
import { ValidationErrorCode } from '../errors/ErrorCodes';

export interface ContactManagerFormRequestPayload {
  formType: FormType;
  formData: Record<string, any>;
  imageBase64?: string;
}

export interface ContactManagerFormRequestBody {
  formType: FormType;
  [key: string]: any; // Allow additional form fields
}

/**
 * Value object representing a contact manager form request
 */
export class ContactManagerFormRequest {
  public readonly formType: FormType;
  public readonly formData: Record<string, any>;
  public readonly imageBase64?: string;
  public readonly timestamp: Date;

  constructor(
    formType: FormType,
    formData: Record<string, any>,
    imageBase64?: string
  ) {
    if (!formType || !Object.values(FormType).includes(formType)) {
      throw new ValidationError('Invalid form type', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    if (!formData || typeof formData !== 'object') {
      throw new ValidationError('Form data must be an object', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    this.formType = formType;
    this.formData = { ...formData }; // Create a copy to ensure immutability
    this.imageBase64 = imageBase64;
    this.timestamp = getCentralAmericaTime();

    // Freeze the object to prevent runtime modifications
    Object.freeze(this);
  }

  /**
   * Creates a ContactManagerFormRequest from request body
   * @param body - Request body containing form data
   * @returns ContactManagerFormRequest instance
   * @throws Error if validation fails
   */
  static fromBody(body: unknown): ContactManagerFormRequest {
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Request body must be an object', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    const requestBody = body as ContactManagerFormRequestBody;
    
    if (!requestBody.formType || !Object.values(FormType).includes(requestBody.formType)) {
      throw new ValidationError('Invalid form type', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    // Extract form data by removing formType and imageBase64 from the payload
    const { formType, imageBase64, ...formData } = requestBody;

    return new ContactManagerFormRequest(
      formType,
      formData,
      imageBase64
    );
  }

  /**
   * Converts to payload format for API response
   * @returns Payload representation
   */
  toPayload(): ContactManagerFormRequestPayload {
    return {
      formType: this.formType,
      formData: { ...this.formData },
      imageBase64: this.imageBase64
    };
  }

  /**
   * Gets the form data without imageBase64 for storage
   * @returns Form data without image
   */
  getFormDataForStorage(): Record<string, any> {
    const { imageBase64, ...formData } = this.formData;
    return formData;
  }
}
