import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { IPresenceRepository } from '../../../src/domain/interfaces/IPresenceRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockWebPubSubService, createMockPresenceRepository, createMockUser } from './domainServiceTestSetup';
import { Status } from '../../../src/domain/enums/Status';

describe('PresenceDomainService', () => {
  let service: PresenceDomainService;
  let mockPresenceRepository: jest.Mocked<IPresenceRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockPresenceRepository = createMockPresenceRepository();
    mockUserRepository = createMockUserRepository();
    mockWebPubSubService = createMockWebPubSubService();
    service = new PresenceDomainService(
      mockPresenceRepository,
      mockUserRepository,
      mockWebPubSubService
    );
  });

  describe('setUserOnline', () => {
    it('should set user online successfully', async () => {
      const userId = 'user@example.com';
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
        fullName: 'User Name',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.findById.mockResolvedValue(null);
      mockPresenceRepository.upsertPresence.mockResolvedValue(undefined);
      mockPresenceRepository.createPresenceHistory.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastPresence = jest.fn().mockResolvedValue(undefined);

      await service.setUserOnline(userId);

      expect(mockPresenceRepository.upsertPresence).toHaveBeenCalledWith('user-id', Status.Online, expect.any(Date));
      expect(mockPresenceRepository.createPresenceHistory).toHaveBeenCalled();
      expect(mockWebPubSubService.broadcastPresence).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      const userId = 'non-existent@example.com';

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.setUserOnline(userId)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('setUserOffline', () => {
    it('should set user offline successfully', async () => {
      const userId = 'user@example.com';
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
        fullName: 'User Name',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.findById.mockResolvedValue(null);
      mockPresenceRepository.upsertPresence.mockResolvedValue(undefined);
      mockPresenceRepository.closeOpenPresenceHistory.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastPresence = jest.fn().mockResolvedValue(undefined);

      await service.setUserOffline(userId);

      expect(mockPresenceRepository.upsertPresence).toHaveBeenCalledWith('user-id', Status.Offline, expect.any(Date));
      expect(mockPresenceRepository.closeOpenPresenceHistory).toHaveBeenCalled();
      expect(mockWebPubSubService.broadcastPresence).toHaveBeenCalled();
    });
  });

  describe('getPresenceStatus', () => {
    it('should return online status when user is online', async () => {
      const userId = 'user@example.com';
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPresenceRepository.findPresenceByUserId.mockResolvedValue({
        status: Status.Online,
      } as any);

      const result = await service.getPresenceStatus(userId);

      expect(result).toBe(Status.Online);
    });

    it('should return offline status when no presence found', async () => {
      const userId = 'user@example.com';
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPresenceRepository.findPresenceByUserId.mockResolvedValue(null);

      const result = await service.getPresenceStatus(userId);

      expect(result).toBe(Status.Offline);
    });
  });
});

