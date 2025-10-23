/**
 * @fileoverview ContactManagerFormRepository tests
 * @description Unit tests for ContactManagerFormRepository
 */

import { ContactManagerFormRepository } from '../../../../shared/infrastructure/repositories/ContactManagerFormRepository';
import { ContactManagerFormData } from '../../../../shared/domain/interfaces/IContactManagerFormRepository';
import { FormType } from '../../../../shared/domain/enums/FormType';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma client
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  contactManagerForm: {
    create: jest.fn(),
    findUnique: jest.fn()
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T00:00:00Z'))
}));

describe('ContactManagerFormRepository', () => {
  let repository: ContactManagerFormRepository;
  let mockPrisma: any;

  beforeEach(() => {
    repository = new ContactManagerFormRepository();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe('createForm', () => {
    it('should create contact manager form successfully', async () => {
      const mockForm = {
        id: 'form-123',
        formType: FormType.DISCONNECTIONS,
        senderId: 'sender-123',
        imageUrl: 'https://example.com/image.jpg',
        data: { description: 'Test incident' },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.contactManagerForm.create.mockResolvedValue(mockForm);

      const formData: ContactManagerFormData = {
        formType: FormType.DISCONNECTIONS,
        senderId: 'sender-123',
        imageUrl: 'https://example.com/image.jpg',
        data: { description: 'Test incident' }
      };

      const result = await repository.createForm(formData);

      expect(result).toBe('form-123');
      expect(mockPrisma.contactManagerForm.create).toHaveBeenCalledWith({
        data: {
          formType: FormType.DISCONNECTIONS,
          senderId: 'sender-123',
          imageUrl: 'https://example.com/image.jpg',
          data: { description: 'Test incident' },
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z')
        }
      });
    });

    it('should handle different form types', async () => {
      const mockForm = {
        id: 'form-456',
        formType: FormType.ADMISSIONS,
        senderId: 'sender-456',
        imageUrl: 'https://example.com/complaint.jpg',
        data: { complaint: 'Test complaint' },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.contactManagerForm.create.mockResolvedValue(mockForm);

      const formData: ContactManagerFormData = {
        formType: FormType.ADMISSIONS,
        senderId: 'sender-456',
        imageUrl: 'https://example.com/complaint.jpg',
        data: { complaint: 'Test complaint' }
      };

      const result = await repository.createForm(formData);

      expect(result).toBe('form-456');
      expect(mockPrisma.contactManagerForm.create).toHaveBeenCalledWith({
        data: {
          formType: FormType.ADMISSIONS,
          senderId: 'sender-456',
          imageUrl: 'https://example.com/complaint.jpg',
          data: { complaint: 'Test complaint' },
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z')
        }
      });
    });

    it('should handle form without image', async () => {
      const mockForm = {
        id: 'form-789',
        formType: FormType.ASSISTANCE,
        senderId: 'sender-789',
        imageUrl: undefined,
        data: { description: 'Test incident without image' },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.contactManagerForm.create.mockResolvedValue(mockForm);

      const formData: ContactManagerFormData = {
        formType: FormType.ASSISTANCE,
        senderId: 'sender-789',
        data: { description: 'Test incident without image' }
      };

      const result = await repository.createForm(formData);

      expect(result).toBe('form-789');
      expect(mockPrisma.contactManagerForm.create).toHaveBeenCalledWith({
        data: {
          formType: FormType.ASSISTANCE,
          senderId: 'sender-789',
          imageUrl: undefined,
          data: { description: 'Test incident without image' },
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z')
        }
      });
    });

    it('should throw error when creation fails', async () => {
      mockPrisma.contactManagerForm.create.mockRejectedValue(new Error('Database error'));

      const formData: ContactManagerFormData = {
        formType: FormType.DISCONNECTIONS,
        senderId: 'sender-123',
        imageUrl: 'https://example.com/image.jpg',
        data: { description: 'Test incident' }
      };

      await expect(repository.createForm(formData))
        .rejects.toThrow('Failed to create contact manager form: Database error');
    });
  });

  describe('findById', () => {
    it('should return form when found', async () => {
      const mockForm = {
        id: 'form-123',
        formType: FormType.DISCONNECTIONS,
        senderId: 'sender-123',
        imageUrl: 'https://example.com/image.jpg',
        data: { description: 'Test incident' },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        sender: {
          id: 'sender-123',
          email: 'sender@example.com',
          fullName: 'Test Sender',
          role: 'ContactManager'
        }
      };

      mockPrisma.contactManagerForm.findUnique.mockResolvedValue(mockForm);

      const result = await repository.findById('form-123');

      expect(result).toEqual(mockForm);
      expect(mockPrisma.contactManagerForm.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-123' },
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
    });

    it('should return null when form not found', async () => {
      mockPrisma.contactManagerForm.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle different form IDs', async () => {
      const mockForm = {
        id: 'form-456',
        formType: FormType.ADMISSIONS,
        senderId: 'sender-456',
        imageUrl: 'https://example.com/complaint.jpg',
        data: { complaint: 'Test complaint' },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        sender: {
          id: 'sender-456',
          email: 'sender456@example.com',
          fullName: 'Test Sender 456',
          role: 'ContactManager'
        }
      };

      mockPrisma.contactManagerForm.findUnique.mockResolvedValue(mockForm);

      const result = await repository.findById('form-456');

      expect(result).toEqual(mockForm);
      expect(mockPrisma.contactManagerForm.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-456' },
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
    });

    it('should throw error when query fails', async () => {
      mockPrisma.contactManagerForm.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById('form-123'))
        .rejects.toThrow('Failed to find contact manager form: Database error');
    });
  });
});
