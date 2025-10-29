import { LiveKitTokenDomainService } from '../../../../shared/domain/services/LiveKitTokenDomainService';
import { LiveKitTokenRequest } from '../../../../shared/domain/value-objects/LiveKitTokenRequest';
import { ILiveKitService } from '../../../../shared/domain/interfaces/ILiveKitService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';
import { UserRole } from '../../../../shared/domain/enums/UserRole';

jest.mock('../../../../shared/config', () => ({ config: { livekitApiUrl: 'wss://test-livekit.com' } }));

describe('LiveKitTokenDomainService', () => {
  let service: LiveKitTokenDomainService;
  let liveKitService: jest.Mocked<ILiveKitService>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    liveKitService = { ensureRoom: jest.fn(), generateToken: jest.fn(), listRooms: jest.fn() } as any;
    userRepository = { findByAzureAdObjectId: jest.fn() } as any;
    service = new LiveKitTokenDomainService(liveKitService, userRepository);
  });

  describe('generateTokenForUser', () => {
    it('should generate token for Employee with own room', async () => {
      const mockUser = { id: 'user-123', email: 'employee@example.com', role: UserRole.Employee };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      liveKitService.ensureRoom.mockResolvedValue(undefined);
      liveKitService.generateToken.mockResolvedValue('mock-token');
      const request = new LiveKitTokenRequest('caller-123');
      const result = await service.generateTokenForUser(request);
      expect(liveKitService.ensureRoom).toHaveBeenCalledWith('user-123');
      expect(result.rooms).toHaveLength(1);
    });

    it('should generate token for Admin with all other rooms', async () => {
      const mockUser = { id: 'admin-123', email: 'admin@example.com', role: UserRole.Admin };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      liveKitService.ensureRoom.mockResolvedValue(undefined);
      liveKitService.listRooms.mockResolvedValue(['admin-123', 'room-1', 'room-2']);
      liveKitService.generateToken.mockResolvedValue('mock-token');
      const request = new LiveKitTokenRequest('caller-123');
      const result = await service.generateTokenForUser(request);
      expect(result.rooms).toHaveLength(2);
    });

    it('should throw UserNotFoundError when user not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      const request = new LiveKitTokenRequest('caller-123');
      await expect(service.generateTokenForUser(request)).rejects.toThrow(UserNotFoundError);
    });
  });
});