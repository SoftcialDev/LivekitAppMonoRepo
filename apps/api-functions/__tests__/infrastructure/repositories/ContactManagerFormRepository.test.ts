import { ContactManagerFormRepository } from '../../../src/infrastructure/repositories/ContactManagerFormRepository';
import { FormType } from '../../../src/domain/enums/FormType';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapEntityCreationError, wrapDatabaseQueryError } from '../../../src/utils/error/ErrorHelpers';
import { Prisma, FormType as PrismaFormType } from '@prisma/client';
import { EntityCreationError, DatabaseQueryError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, createMockContactManagerForm, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapEntityCreationError = wrapEntityCreationError as jest.MockedFunction<typeof wrapEntityCreationError>;
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;

describe('ContactManagerFormRepository', () => {
  let repository: ContactManagerFormRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new ContactManagerFormRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('createForm', () => {
    it('should create a form successfully', async () => {
      const formData = {
        formType: FormType.DISCONNECTIONS,
        senderId: 'sender-id',
        imageUrl: 'https://example.com/image.jpg',
        data: { field: 'value' },
      };

      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Disconnections,
      });

      mockPrismaClient.contactManagerForm.create.mockResolvedValue(prismaForm);

      const result = await repository.createForm(formData);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.contactManagerForm.create).toHaveBeenCalledWith({
        data: {
          formType: 'Disconnections',
          senderId: formData.senderId,
          imageUrl: formData.imageUrl,
          data: formData.data as Prisma.InputJsonValue,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result).toBe('form-id');
    });

    it('should map ADMISSIONS form type correctly', async () => {
      const formData = {
        formType: FormType.ADMISSIONS,
        senderId: 'sender-id',
        data: { field: 'value' },
      };

      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Admissions,
      });

      mockPrismaClient.contactManagerForm.create.mockResolvedValue(prismaForm);

      await repository.createForm(formData);

      expect(mockPrismaClient.contactManagerForm.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formType: 'Admissions',
        }),
      });
    });

    it('should map ASSISTANCE form type correctly', async () => {
      const formData = {
        formType: FormType.ASSISTANCE,
        senderId: 'sender-id',
        data: { field: 'value' },
      };

      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Assistance,
      });

      mockPrismaClient.contactManagerForm.create.mockResolvedValue(prismaForm);

      const result = await repository.createForm(formData);

      expect(mockPrismaClient.contactManagerForm.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formType: 'Assistance',
        }),
      });
      expect(result).toBe('form-id');
    });

    it('should throw EntityCreationError on create failure', async () => {
      const formData = {
        formType: FormType.DISCONNECTIONS,
        senderId: 'sender-id',
        data: { field: 'value' },
      };

      const error = new Error('Database error');
      mockPrismaClient.contactManagerForm.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to create contact manager form', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.createForm(formData)).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to create contact manager form', error);
    });
  });

  describe('findById', () => {
    it('should find a form by id', async () => {
      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Disconnections,
      });

      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(prismaForm);

      const result = await repository.findById('form-id');

      expect(mockPrismaClient.contactManagerForm.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-id' },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('form-id');
      expect(result?.formType).toBe(FormType.DISCONNECTIONS);
    });

    it('should map Prisma FormType to domain FormType', async () => {
      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Admissions,
      });

      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(prismaForm);

      const result = await repository.findById('form-id');

      expect(result?.formType).toBe(FormType.ADMISSIONS);
    });

    it('should map Prisma FormType Assistance to domain FormType', async () => {
      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Assistance,
      });

      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(prismaForm);

      const result = await repository.findById('form-id');

      expect(result?.formType).toBe(FormType.ASSISTANCE);
    });

    it('should map Prisma FormType Disconnections to domain FormType', async () => {
      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Disconnections,
      });

      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(prismaForm);

      const result = await repository.findById('form-id');

      expect(result?.formType).toBe(FormType.DISCONNECTIONS);
    });

    it('should default to DISCONNECTIONS for unknown Prisma FormType', async () => {
      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: 'Unknown' as PrismaFormType,
      });

      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(prismaForm);

      const result = await repository.findById('form-id');

      expect(result?.formType).toBe(FormType.DISCONNECTIONS);
    });

    it('should map all form fields correctly', async () => {
      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Disconnections,
        senderId: 'sender-id',
        imageUrl: 'https://example.com/image.jpg',
        data: { field: 'value' },
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(prismaForm);

      const result = await repository.findById('form-id');

      expect(result?.id).toBe('form-id');
      expect(result?.formType).toBe(FormType.DISCONNECTIONS);
      expect(result?.senderId).toBe('sender-id');
      expect(result?.imageUrl).toBe('https://example.com/image.jpg');
      expect(result?.data).toEqual({ field: 'value' });
      expect(result?.createdAt).toEqual(mockDate);
      expect(result?.updatedAt).toEqual(mockDate);
    });

    it('should return null when form not found', async () => {
      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.contactManagerForm.findUnique.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find contact manager form', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findById('form-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find contact manager form', error);
    });

    it('should handle form with null imageUrl', async () => {
      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Disconnections,
        imageUrl: null,
      });

      mockPrismaClient.contactManagerForm.findUnique.mockResolvedValue(prismaForm);

      const result = await repository.findById('form-id');

      expect(result).not.toBeNull();
      expect(result?.imageUrl).toBeNull();
    });

    it('should create form without imageUrl', async () => {
      const formData = {
        formType: FormType.DISCONNECTIONS,
        senderId: 'sender-id',
        data: { field: 'value' },
      };

      const prismaForm = createMockContactManagerForm({
        id: 'form-id',
        formType: PrismaFormType.Disconnections,
        imageUrl: null,
      });

      mockPrismaClient.contactManagerForm.create.mockResolvedValue(prismaForm);

      const result = await repository.createForm(formData);

      expect(mockPrismaClient.contactManagerForm.create).toHaveBeenCalledWith({
        data: {
          formType: 'Disconnections',
          senderId: formData.senderId,
          imageUrl: undefined,
          data: formData.data as Prisma.InputJsonValue,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result).toBe('form-id');
    });
  });
});
