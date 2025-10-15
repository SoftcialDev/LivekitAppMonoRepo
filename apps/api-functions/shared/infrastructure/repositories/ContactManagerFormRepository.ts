/**
 * @fileoverview ContactManagerFormRepository - Repository for contact manager form data access
 * @description Implements data access operations for contact manager forms using Prisma
 */

import { IContactManagerFormRepository, ContactManagerFormData } from '../../domain/interfaces/IContactManagerFormRepository';
import prisma from '../database/PrismaClientService';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Repository for contact manager form data access operations
 */
export class ContactManagerFormRepository implements IContactManagerFormRepository {
  /**
   * Creates a new contact manager form
   * @param formData - Form data to create
   * @returns Promise that resolves to created form ID
   * @throws Error if creation fails
   */
  async createForm(formData: ContactManagerFormData): Promise<string> {
    try {
      const now = getCentralAmericaTime();
      
      const record = await prisma.contactManagerForm.create({
        data: {
          formType: formData.formType,
          senderId: formData.senderId,
          imageUrl: formData.imageUrl,
          data: formData.data,
          createdAt: now,
          updatedAt: now
        }
      });

      return record.id;
    } catch (error: any) {
      throw new Error(`Failed to create contact manager form: ${error.message}`);
    }
  }

  /**
   * Finds a form by ID
   * @param formId - ID of the form to find
   * @returns Promise that resolves to form data or null if not found
   * @throws Error if query fails
   */
  async findById(formId: string): Promise<any | null> {
    try {
      const form = await prisma.contactManagerForm.findUnique({
        where: { id: formId },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true
            }
          }
        }
      });

      return form;
    } catch (error: any) {
      throw new Error(`Failed to find contact manager form: ${error.message}`);
    }
  }
}
