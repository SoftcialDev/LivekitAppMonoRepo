/**
 * @fileoverview ContactManagerFormRepository - Repository for contact manager form data access
 * @summary Implements data access operations for contact manager forms using Prisma
 * @description Provides Prisma-based implementation of contact manager form repository operations
 */

import { IContactManagerFormRepository } from '../../domain/interfaces/IContactManagerFormRepository';
import { ContactManagerFormData, ContactManagerForm } from '../../domain/types/ContactManagerFormTypes';
import { FormType } from '../../domain/enums/FormType';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapEntityCreationError, wrapDatabaseQueryError } from '../../utils/error/ErrorHelpers';
import prisma from '../database/PrismaClientService';
import { Prisma, FormType as PrismaFormType } from '@prisma/client';

/**
 * Repository for contact manager form data access operations
 * @description Implements IContactManagerFormRepository using Prisma for database operations
 */
export class ContactManagerFormRepository implements IContactManagerFormRepository {
  /**
   * Creates a new contact manager form
   * @param formData - Form data to create
   * @returns Promise that resolves to created form ID
   * @throws EntityCreationError if creation fails
   */
  async createForm(formData: ContactManagerFormData): Promise<string> {
    try {
      const now = getCentralAmericaTime();
      
      const record = await prisma.contactManagerForm.create({
        data: {
          formType: this.mapDomainFormTypeToPrisma(formData.formType),
          senderId: formData.senderId,
          imageUrl: formData.imageUrl,
          data: formData.data as Prisma.InputJsonValue,
          createdAt: now,
          updatedAt: now
        }
      });

      return record.id;
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to create contact manager form', error);
    }
  }

  /**
   * Finds a form by ID
   * @param formId - ID of the form to find
   * @returns Promise that resolves to form data or null if not found
   * @throws DatabaseQueryError if query fails
   */
  async findById(formId: string): Promise<ContactManagerForm | null> {
    try {
      const form = await prisma.contactManagerForm.findUnique({
        where: { id: formId },
      });

      return form ? this.mapToContactManagerForm(form) : null;
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find contact manager form', error);
    }
  }

  /**
   * Maps Prisma model to domain type
   * @param prismaForm - Prisma contact manager form model
   * @returns ContactManagerForm domain type
   */
  private mapToContactManagerForm(prismaForm: {
    id: string;
    formType: PrismaFormType;
    senderId: string;
    imageUrl: string | null;
    data: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): ContactManagerForm {
    return {
      id: prismaForm.id,
      formType: this.mapFormType(prismaForm.formType),
      senderId: prismaForm.senderId,
      imageUrl: prismaForm.imageUrl,
      data: prismaForm.data,
      createdAt: prismaForm.createdAt,
      updatedAt: prismaForm.updatedAt,
    };
  }

  /**
   * Maps domain FormType enum to Prisma FormType enum
   * @param domainFormType - Domain FormType enum value
   * @returns Prisma FormType enum value
   */
  private mapDomainFormTypeToPrisma(domainFormType: FormType): PrismaFormType {
    switch (domainFormType) {
      case FormType.DISCONNECTIONS:
        return PrismaFormType.Disconnections;
      case FormType.ADMISSIONS:
        return PrismaFormType.Admissions;
      case FormType.ASSISTANCE:
        return PrismaFormType.Assistance;
      default:
        return PrismaFormType.Disconnections;
    }
  }

  /**
   * Maps Prisma FormType enum to domain FormType enum
   * @param prismaFormType - Prisma FormType enum value
   * @returns Domain FormType enum value
   */
  private mapFormType(prismaFormType: PrismaFormType | string): FormType {
    const formTypeStr = typeof prismaFormType === 'string' ? prismaFormType : String(prismaFormType);
    switch (formTypeStr) {
      case 'Disconnections':
        return FormType.DISCONNECTIONS;
      case 'Admissions':
        return FormType.ADMISSIONS;
      case 'Assistance':
        return FormType.ASSISTANCE;
      default:
        return FormType.DISCONNECTIONS;
    }
  }
}
