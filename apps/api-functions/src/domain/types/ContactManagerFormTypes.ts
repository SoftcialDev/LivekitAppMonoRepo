/**
 * @fileoverview ContactManagerFormTypes - Type definitions for contact manager form data
 * @summary Defines types and interfaces for contact manager form data structures
 * @description Encapsulates contact manager form data structure
 */

import { FormType } from '../enums/FormType';

/**
 * Contact manager form data structure
 * @description Represents the data structure for a contact manager form submission
 */
export interface ContactManagerFormData {
  /**
   * Type of form being submitted
   */
  formType: FormType;

  /**
   * Identifier of the user submitting the form
   */
  senderId: string;

  /**
   * Optional image URL associated with the form
   */
  imageUrl?: string;

  /**
   * Form-specific data as key-value pairs
   */
  data: Record<string, any>;
}

