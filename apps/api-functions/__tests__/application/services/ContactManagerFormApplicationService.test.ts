import { ContactManagerFormApplicationService } from '../../../src/application/services/ContactManagerFormApplicationService';
import { IContactManagerFormService } from '../../../src/domain/interfaces/IContactManagerFormService';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ContactManagerFormRequest } from '../../../src/domain/value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../../../src/domain/value-objects/ContactManagerFormResult';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { FormType } from '../../../src/domain/enums/FormType';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('ContactManagerFormApplicationService', () => {
  let service: ContactManagerFormApplicationService;
  let mockFormService: jest.Mocked<IContactManagerFormService>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockFormService = {
      processForm: jest.fn(),
    } as any;

    mockAuthorizationService = {} as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    service = new ContactManagerFormApplicationService(
      mockFormService,
      mockAuthorizationService,
      mockUserRepository
    );
  });

  describe('processForm', () => {
    const callerId = 'test-caller-id';
    const user = new User({
      id: 'user-id',
      azureAdObjectId: callerId,
      email: 'user@example.com',
      fullName: 'Test User',
      role: UserRole.ContactManager,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should successfully process form', async () => {
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { field: 'value' });
      const mockResult = ContactManagerFormResult.fromFormCreation('form-id', true, 'image-url');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockFormService.processForm.mockResolvedValue(mockResult);

      const result = await service.processForm(request, callerId);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockFormService.processForm).toHaveBeenCalledWith(
        request,
        user.id,
        user.fullName,
        user.email
      );
      expect(result).toBe(mockResult);
    });

    it('should throw error when user not found', async () => {
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { field: 'value' });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.processForm(request, callerId)).rejects.toThrow(UserNotFoundError);
      expect(mockFormService.processForm).not.toHaveBeenCalled();
    });
  });
});


