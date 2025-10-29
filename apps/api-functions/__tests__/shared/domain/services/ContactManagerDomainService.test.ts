// Mock Prisma enums using centralized mock
jest.mock('@prisma/client', () => require('../../../mocks/prisma-enums').PrismaMock);

import { ContactManagerDomainService } from '../../../../shared/domain/services/ContactManagerDomainService';
import { CreateContactManagerRequest } from '../../../../shared/domain/value-objects/CreateContactManagerRequest';
import { DeleteContactManagerRequest } from '../../../../shared/domain/value-objects/DeleteContactManagerRequest';
import { UpdateContactManagerStatusRequest } from '../../../../shared/domain/value-objects/UpdateContactManagerStatusRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';
import { ContactManagerStatus, UserRole } from '@prisma/client';

describe('ContactManagerDomainService', () => {
  let service: ContactManagerDomainService;
  let userRepository: jest.Mocked<IUserRepository>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByEmail: jest.fn(), changeUserRole: jest.fn(), createContactManagerProfile: jest.fn(), createContactManagerStatusHistory: jest.fn(), findContactManagerProfile: jest.fn(), deleteContactManagerProfile: jest.fn(), createContactManagerAuditLog: jest.fn(), findAllContactManagers: jest.fn(), findByAzureAdObjectId: jest.fn(), findContactManagerProfileByUserId: jest.fn(), updateContactManagerStatus: jest.fn() } as any;
    webPubSubService = { broadcastMessage: jest.fn() } as any;
    service = new ContactManagerDomainService(userRepository, webPubSubService);
  });

  describe('createContactManager', () => {
    it('should create contact manager successfully', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      const mockProfile = { id: 'profile-123', userId: 'user-123', status: ContactManagerStatus.Available };
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      userRepository.createContactManagerProfile.mockResolvedValue(mockProfile as any);
      const request = new CreateContactManagerRequest('user@example.com', ContactManagerStatus.Available as any);
      const result = await service.createContactManager(request);
      expect(userRepository.changeUserRole).toHaveBeenCalledWith('user-123', UserRole.ContactManager);
    });

    it('should throw error when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const request = new CreateContactManagerRequest('user@example.com', ContactManagerStatus.Available as any);
      await expect(service.createContactManager(request)).rejects.toThrow('not found in database');
    });
  });

  describe('deleteContactManager', () => {
    it('should delete contact manager successfully', async () => {
      const mockProfile = { id: 'profile-123', userId: 'user-123' };
      userRepository.findContactManagerProfile.mockResolvedValue(mockProfile as any);
      const request = new DeleteContactManagerRequest('profile-123');
      await service.deleteContactManager(request);
      expect(userRepository.changeUserRole).toHaveBeenCalledWith('user-123', UserRole.Unassigned);
    });

    it('should throw error when profile not found', async () => {
      userRepository.findContactManagerProfile.mockResolvedValue(null);
      const request = new DeleteContactManagerRequest('profile-123');
      await expect(service.deleteContactManager(request)).rejects.toThrow('not found');
    });
  });

  describe('listContactManagers', () => {
    it('should list all contact managers', async () => {
      const mockProfiles = [{ id: 'profile-1', userId: 'user-1', status: ContactManagerStatus.Available, createdAt: new Date(), updatedAt: new Date(), user: { fullName: 'User One' } }];
      userRepository.findAllContactManagers.mockResolvedValue(mockProfiles as any);
      const result = await service.listContactManagers();
      expect(result.contactManagers).toBeDefined();
    });
  });

  describe('getMyContactManagerStatus', () => {
    it('should get contact manager status', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com', fullName: 'User Name' };
      const mockProfile = { id: 'profile-123', userId: 'user-123', status: ContactManagerStatus.Available, createdAt: new Date(), updatedAt: new Date(), user: mockUser };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      userRepository.findContactManagerProfileByUserId.mockResolvedValue(mockProfile as any);
      const result = await service.getMyContactManagerStatus('azure-123');
      expect(result.status).toBe(ContactManagerStatus.Available);
    });
  });

  describe('updateMyContactManagerStatus', () => {
    it('should update contact manager status and broadcast', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com', fullName: 'User Name' };
      const mockProfile = { id: 'profile-123', userId: 'user-123', status: ContactManagerStatus.Available, createdAt: new Date(), updatedAt: new Date(), user: mockUser };
      const mockUpdatedProfile = { ...mockProfile, status: ContactManagerStatus.Unavailable };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      userRepository.findContactManagerProfileByUserId.mockResolvedValue(mockProfile as any);
      userRepository.updateContactManagerStatus.mockResolvedValue(mockUpdatedProfile as any);
      webPubSubService.broadcastMessage.mockResolvedValue(undefined);
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Unavailable as any);
      const result = await service.updateMyContactManagerStatus('azure-123', request);
      expect(userRepository.updateContactManagerStatus).toHaveBeenCalled();
      expect(webPubSubService.broadcastMessage).toHaveBeenCalled();
    });
  });
});