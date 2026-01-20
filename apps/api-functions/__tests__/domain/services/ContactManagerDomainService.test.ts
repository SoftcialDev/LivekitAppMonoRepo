import { ContactManagerDomainService } from '../../../src/domain/services/ContactManagerDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { CreateContactManagerRequest } from '../../../src/domain/value-objects/CreateContactManagerRequest';
import { DeleteContactManagerRequest } from '../../../src/domain/value-objects/DeleteContactManagerRequest';
import { UpdateContactManagerStatusRequest } from '../../../src/domain/value-objects/UpdateContactManagerStatusRequest';
import { ContactManagerListResponse } from '../../../src/domain/value-objects/ContactManagerListResponse';
import { ContactManagerStatusResponse } from '../../../src/domain/value-objects/ContactManagerStatusResponse';
import { ContactManagerUserNotFoundError, ContactManagerProfileNotFoundError } from '../../../src/domain/errors/ContactManagerErrors';
import { createMockUserRepository, createMockWebPubSubService, createMockUser } from './domainServiceTestSetup';
import { UserRole, ContactManagerStatus } from '@prisma/client';
import { ContactManagerProfile } from '../../../src/domain/entities/ContactManagerProfile';

describe('ContactManagerDomainService', () => {
  let service: ContactManagerDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockWebPubSubService = createMockWebPubSubService();
    service = new ContactManagerDomainService(mockUserRepository, mockWebPubSubService);
  });

  describe('createContactManager', () => {
    it('should create contact manager successfully', async () => {
      const request = new CreateContactManagerRequest('user@example.com', ContactManagerStatus.Available);
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
        role: UserRole.PSO,
      });
      const profile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.createContactManagerProfile.mockResolvedValue(profile);
      mockUserRepository.createContactManagerStatusHistory.mockResolvedValue(undefined);

      const result = await service.createContactManager(request);

      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('user-id', UserRole.ContactManager);
      expect(mockUserRepository.createContactManagerProfile).toHaveBeenCalledWith('user-id', ContactManagerStatus.Available);
      expect(result.id).toBe('profile-id');
    });

    it('should throw error when user not found', async () => {
      const request = new CreateContactManagerRequest('user@example.com', ContactManagerStatus.Available);

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.createContactManager(request)).rejects.toThrow(ContactManagerUserNotFoundError);
    });

    it('should normalize email to lowercase', async () => {
      const request = new CreateContactManagerRequest('USER@EXAMPLE.COM', ContactManagerStatus.Available);
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
      });
      const profile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.createContactManagerProfile.mockResolvedValue(profile);
      mockUserRepository.createContactManagerStatusHistory.mockResolvedValue(undefined);

      await service.createContactManager(request);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('deleteContactManager', () => {
    it('should delete contact manager successfully', async () => {
      const request = new DeleteContactManagerRequest('profile-id');
      const profile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findContactManagerProfile.mockResolvedValue(profile);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.deleteContactManagerProfile.mockResolvedValue(undefined);
      mockUserRepository.createContactManagerAuditLog.mockResolvedValue(undefined);

      await service.deleteContactManager(request);

      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('user-id', UserRole.Unassigned);
      expect(mockUserRepository.deleteContactManagerProfile).toHaveBeenCalledWith('profile-id');
    });

    it('should throw error when profile not found', async () => {
      const request = new DeleteContactManagerRequest('profile-id');

      mockUserRepository.findContactManagerProfile.mockResolvedValue(null);

      await expect(service.deleteContactManager(request)).rejects.toThrow(ContactManagerProfileNotFoundError);
    });
  });

  describe('listContactManagers', () => {
    it('should return list of contact managers', async () => {
      const profile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findActiveUsersByRole.mockResolvedValue([]);
      mockUserRepository.findAllContactManagers.mockResolvedValue([profile]);

      const result = await service.listContactManagers();

      expect(result).toBeInstanceOf(ContactManagerListResponse);
    });

    it('should create missing profiles', async () => {
      const user = { id: 'user-id', email: 'user@example.com', fullName: 'User' };
      const profile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findActiveUsersByRole.mockResolvedValue([user] as any);
      mockUserRepository.findAllContactManagers.mockResolvedValueOnce([]).mockResolvedValueOnce([profile]);
      mockUserRepository.createContactManagerProfile.mockResolvedValue(profile);

      await service.listContactManagers();

      expect(mockUserRepository.createContactManagerProfile).toHaveBeenCalledWith('user-id', ContactManagerStatus.Unavailable);
    });
  });

  describe('getMyContactManagerStatus', () => {
    it('should return contact manager status', async () => {
      const azureAdObjectId = 'caller-id';
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId,
      });
      const profile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.findContactManagerProfileByUserId.mockResolvedValue(profile);

      const result = await service.getMyContactManagerStatus(azureAdObjectId);

      expect(result).toBeInstanceOf(ContactManagerStatusResponse);
    });

    it('should throw error when user not found', async () => {
      const azureAdObjectId = 'caller-id';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.getMyContactManagerStatus(azureAdObjectId)).rejects.toThrow(ContactManagerUserNotFoundError);
    });

    it('should throw error when profile not found', async () => {
      const azureAdObjectId = 'caller-id';
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.findContactManagerProfileByUserId.mockResolvedValue(null);

      await expect(service.getMyContactManagerStatus(azureAdObjectId)).rejects.toThrow(ContactManagerProfileNotFoundError);
    });
  });

  describe('updateMyContactManagerStatus', () => {
    it('should update contact manager status successfully', async () => {
      const azureAdObjectId = 'caller-id';
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.OnBreak);
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId,
        email: 'user@example.com',
        fullName: 'User Name',
      });
      const profile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedProfile = new ContactManagerProfile({
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.findContactManagerProfileByUserId.mockResolvedValueOnce(profile).mockResolvedValueOnce(updatedProfile);
      mockUserRepository.updateContactManagerStatus.mockResolvedValue(undefined);
      mockUserRepository.createContactManagerStatusHistory.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.updateMyContactManagerStatus(azureAdObjectId, request);

      expect(mockUserRepository.updateContactManagerStatus).toHaveBeenCalledWith('profile-id', ContactManagerStatus.OnBreak);
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ContactManagerStatusResponse);
    });
  });
});






