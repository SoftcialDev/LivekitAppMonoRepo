import { LiveKitTokenDomainService } from '../../../src/domain/services/LiveKitTokenDomainService';
import { ILiveKitService } from '../../../src/domain/interfaces/ILiveKitService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { LiveKitTokenRequest } from '../../../src/domain/value-objects/LiveKitTokenRequest';
import { LiveKitTokenResponse } from '../../../src/domain/value-objects/LiveKitTokenResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockLiveKitService, createMockUser, createMockSupervisor } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

jest.mock('../../../src/config', () => ({
  config: {
    livekitApiUrl: 'https://livekit.example.com',
  },
}));

describe('LiveKitTokenDomainService', () => {
  let service: LiveKitTokenDomainService;
  let mockLiveKitService: jest.Mocked<ILiveKitService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockLiveKitService = createMockLiveKitService();
    mockUserRepository = createMockUserRepository();
    service = new LiveKitTokenDomainService(mockLiveKitService, mockUserRepository);
  });

  describe('generateTokenForUser', () => {
    it('should generate token for PSO user', async () => {
      const request = new LiveKitTokenRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        role: UserRole.PSO,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockLiveKitService.ensureRoom.mockResolvedValue(undefined);
      mockLiveKitService.generateToken.mockResolvedValue('token-string');

      const result = await service.generateTokenForUser(request);

      expect(mockLiveKitService.ensureRoom).toHaveBeenCalledWith('user-id');
      expect(mockLiveKitService.generateToken).toHaveBeenCalledWith('user-id', false, 'user-id');
      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].room).toBe('user-id');
    });

    it('should generate token for Supervisor with target user', async () => {
      const request = new LiveKitTokenRequest('caller-id', 'target-user-id');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockLiveKitService.ensureRoom.mockResolvedValue(undefined);
      mockLiveKitService.generateToken.mockResolvedValue('token-string');

      const result = await service.generateTokenForUser(request);

      expect(mockLiveKitService.generateToken).toHaveBeenCalledWith('supervisor-id', true, 'target-user-id');
      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].room).toBe('target-user-id');
    });

    it('should generate tokens for all rooms when Supervisor without target', async () => {
      const request = new LiveKitTokenRequest('caller-id');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockLiveKitService.ensureRoom.mockResolvedValue(undefined);
      mockLiveKitService.listRooms.mockResolvedValue(['room-1', 'room-2', 'supervisor-id']);
      mockLiveKitService.generateToken.mockResolvedValue('token-string');

      const result = await service.generateTokenForUser(request);

      expect(mockLiveKitService.listRooms).toHaveBeenCalled();
      expect(result.rooms).toHaveLength(2);
      expect(result.rooms.map(r => r.room)).toEqual(['room-1', 'room-2']);
    });

    it('should throw error when caller not found', async () => {
      const request = new LiveKitTokenRequest('caller-id');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.generateTokenForUser(request)).rejects.toThrow(UserNotFoundError);
    });
  });
});





