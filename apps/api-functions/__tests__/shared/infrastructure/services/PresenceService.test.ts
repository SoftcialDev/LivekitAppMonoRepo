/**
 * @fileoverview Tests for PresenceService
 * @description Tests for presence management operations
 */

import { PresenceService } from '../../../../shared/infrastructure/services/PresenceService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { PresenceDomainService } from '../../../../shared/domain/services/PresenceDomainService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';

describe('PresenceService', () => {
  let presenceService: PresenceService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPresenceDomainService: jest.Mocked<PresenceDomainService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  const mockUserEmail = 'test@example.com';
  const mockUserId = 'user-id-123';

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getPsosBySupervisor: jest.fn(),
      getSuperAdmins: jest.fn(),
      getContactManagers: jest.fn(),
      getUsersByRole: jest.fn(),
      getSupervisorForPso: jest.fn(),
      getSupervisorByIdentifier: jest.fn(),
      getUsersByIds: jest.fn(),
    };
    mockPresenceDomainService = {
      setUserOffline: jest.fn(),
      setUserOnline: jest.fn(),
      updatePresence: jest.fn(),
      getPresence: jest.fn(),
      getPresenceByUserId: jest.fn(),
      getPresenceBySupervisorId: jest.fn(),
      getPresenceForUsers: jest.fn(),
    };
    mockWebPubSubService = {
      sendToUser: jest.fn(),
      sendToAll: jest.fn(),
      sendToGroup: jest.fn(),
      removeUserFromAllGroups: jest.fn(),
      addUserToGroup: jest.fn(),
      removeUserFromGroup: jest.fn(),
      generateClientToken: jest.fn(),
    };

    presenceService = new PresenceService(
      mockUserRepository,
      mockPresenceDomainService,
      mockWebPubSubService
    );
  });

  describe('setUserOffline', () => {
    it('should set user offline if user exists', async () => {
      const mockUser = { id: mockUserId, email: mockUserEmail } as any;
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await presenceService.setUserOffline(mockUserEmail);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUserEmail);
      expect(mockPresenceDomainService.setUserOffline).toHaveBeenCalledWith(mockUserId);
    });

    it('should warn and return if user does not exist', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await presenceService.setUserOffline('nonexistent@example.com');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockPresenceDomainService.setUserOffline).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('User not found for email: nonexistent@example.com');
      
      consoleWarnSpy.mockRestore();
    });

    it('should warn and not throw if presenceDomainService.setUserOffline fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const mockUser = { id: mockUserId, email: mockUserEmail } as any;
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      const domainError = new Error('Domain service failed');
      mockPresenceDomainService.setUserOffline.mockRejectedValue(domainError);

      await presenceService.setUserOffline(mockUserEmail);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUserEmail);
      expect(mockPresenceDomainService.setUserOffline).toHaveBeenCalledWith(mockUserId);
      expect(consoleWarnSpy).toHaveBeenCalledWith(`Failed to set user ${mockUserEmail} offline:`, domainError);
      
      consoleWarnSpy.mockRestore();
    });
  });
});
