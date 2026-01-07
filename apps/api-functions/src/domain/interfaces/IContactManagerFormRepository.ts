/**
 * @fileoverview IContactManagerFormRepository - Interface for contact manager form data access
 * @description Defines the contract for contact manager form repository operations
 */

import { ContactManagerFormData, ContactManagerForm } from '../types/ContactManagerFormTypes';

/**
 * Interface for contact manager form repository
 */
export interface IContactManagerFormRepository {
  /**
   * Creates a new contact manager form
   * @param formData - Form data to create
   * @returns Promise that resolves to created form ID
   * @throws Error if creation fails
   */
  createForm(formData: ContactManagerFormData): Promise<string>;

  /**
   * Finds a form by ID
   * @param formId - ID of the form to find
   * @returns Promise that resolves to form data or null if not found
   * @throws Error if query fails
   */
  findById(formId: string): Promise<ContactManagerForm | null>;
}
