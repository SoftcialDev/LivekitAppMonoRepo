import { ContactManagerApplicationService } from '../../../src/application/services/ContactManagerApplicationService';
import { ContactManagerDomainService } from '../../../src/domain/services/ContactManagerDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { CreateContactManagerRequest } from '../../../src/domain/value-objects/CreateContactManagerRequest';
import { DeleteContactManagerRequest } from '../../../src/domain/value-objects/DeleteContactManagerRequest';
import { ContactManagerListResponse } from '../../../src/domain/value-objects/ContactManagerListResponse';
import { ContactManagerStatusResponse } from '../../../src/domain/value-objects/ContactManagerStatusResponse';
import { UpdateContactManagerStatusRequest } from '../../../src/domain/value-objects/UpdateContactManagerStatusRequest';
import { ContactManagerProfile } from '../../../src/domain/entities/ContactManagerProfile';
import { ContactManagerStatus } from '@prisma/client';

describe('ContactManagerApplicationService', () => {
  let service: ContactManagerApplicationService;
  let mockDomainService: jest.Mocked<ContactManagerDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      createContactManager: jest.fn(),
      deleteContactManager: jest.fn(),
      listContactManagers: jest.fn(),
      getMyContactManagerStatus: jest.fn(),
      updateMyContactManagerStatus: jest.fn(),
    } as any;

    mockAuthorizationService = {
      canAccessContactManager: jest.fn(),
    } as any;

    service = new ContactManagerApplicationService(mockDomainService, mockAuthorizationService);
  });

  describe('createContactManager', () => {
    it('should successfully create contact manager', async () => {
      const callerId = 'test-caller-id';
      const request = new CreateContactManagerRequest('manager@example.com', ContactManagerStatus.Available);
      const mockProfile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockDomainService.createContactManager.mockResolvedValue(mockProfile);

      const result = await service.createContactManager(request, callerId);

      expect(mockDomainService.createContactManager).toHaveBeenCalledWith(request);
      expect(result).toBe(mockProfile);
    });
  });

  describe('deleteContactManager', () => {
    it('should successfully delete contact manager', async () => {
      const callerId = 'test-caller-id';
      const request = new DeleteContactManagerRequest('profile-id');

      mockDomainService.deleteContactManager.mockResolvedValue(undefined);

      await service.deleteContactManager(request, callerId);

      expect(mockDomainService.deleteContactManager).toHaveBeenCalledWith(request);
    });
  });

  describe('listContactManagers', () => {
    it('should successfully list contact managers', async () => {
      const callerId = 'test-caller-id';
      const mockResponse = new ContactManagerListResponse([]);

      mockDomainService.listContactManagers.mockResolvedValue(mockResponse);

      const result = await service.listContactManagers(callerId);

      expect(mockDomainService.listContactManagers).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });
  });

  describe('getMyContactManagerStatus', () => {
    it('should successfully get contact manager status', async () => {
      const callerId = 'test-caller-id';
      const mockResponse = new ContactManagerStatusResponse(
        'profile-id',
        'user-id',
        'manager@example.com',
        'Manager Name',
        ContactManagerStatus.Available,
        new Date().toISOString(),
        new Date().toISOString()
      );

      mockAuthorizationService.canAccessContactManager.mockResolvedValue(undefined);
      mockDomainService.getMyContactManagerStatus.mockResolvedValue(mockResponse);

      const result = await service.getMyContactManagerStatus(callerId);

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.getMyContactManagerStatus).toHaveBeenCalledWith(callerId);
      expect(result).toBe(mockResponse);
    });

    it('should throw error when authorization fails', async () => {
      const callerId = 'test-caller-id';

      mockAuthorizationService.canAccessContactManager.mockRejectedValue(new Error('Unauthorized'));

      await expect(service.getMyContactManagerStatus(callerId)).rejects.toThrow('Unauthorized');
      expect(mockDomainService.getMyContactManagerStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateMyContactManagerStatus', () => {
    it('should successfully update contact manager status', async () => {
      const callerId = 'test-caller-id';
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Unavailable);
      const mockResponse = new ContactManagerStatusResponse(
        'profile-id',
        'user-id',
        'manager@example.com',
        'Manager Name',
        ContactManagerStatus.Unavailable,
        new Date().toISOString(),
        new Date().toISOString()
      );

      mockAuthorizationService.canAccessContactManager.mockResolvedValue(undefined);
      mockDomainService.updateMyContactManagerStatus.mockResolvedValue(mockResponse);

      const result = await service.updateMyContactManagerStatus(request, callerId);

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.updateMyContactManagerStatus).toHaveBeenCalledWith(callerId, request);
      expect(result).toBe(mockResponse);
    });

    it('should throw error when authorization fails', async () => {
      const callerId = 'test-caller-id';
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Inactive);

      mockAuthorizationService.canAccessContactManager.mockRejectedValue(new Error('Unauthorized'));

      await expect(service.updateMyContactManagerStatus(request, callerId)).rejects.toThrow('Unauthorized');
      expect(mockDomainService.updateMyContactManagerStatus).not.toHaveBeenCalled();
    });
  });
});

