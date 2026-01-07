/**
 * @fileoverview ContactManagerFormTypes - Type definitions for contact manager form data
 * @summary Defines types and interfaces for contact manager form data structures
 * @description Encapsulates contact manager form data structure
 */

import { FormType } from '../enums/FormType';

/**
 * Contact manager form entity
 * @description Represents a contact manager form record from the database
 */
export interface ContactManagerForm {
  /**
   * Unique identifier
   */
  id: string;

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
  imageUrl: string | null;

  /**
   * Form-specific data as JSON
   */
  data: unknown;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

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
  data: Record<string, unknown>;
}
