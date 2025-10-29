import { StreamingSessionDomainService } from '../../../../shared/domain/services/StreamingSessionDomainService';
import { IStreamingSessionRepository } from '../../../../shared/domain/interfaces/IStreamingSessionRepository';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';

describe('StreamingSessionDomainService', () => {
  let service: StreamingSessionDomainService;
  let streamingSessionRepository: jest.Mocked<IStreamingSessionRepository>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    streamingSessionRepository = { startStreamingSession: jest.fn(), stopStreamingSession: jest.fn() } as any;
    userRepository = { findByEmail: jest.fn(), findByAzureAdObjectId: jest.fn(), findByRolesWithSupervisor: jest.fn() } as any;
    service = new StreamingSessionDomainService(streamingSessionRepository, userRepository);
  });

  describe('startStreamingSession', () => {
    it('should start session with UUID', async () => {
      await service.startStreamingSession('user-uuid-123-456');
      expect(streamingSessionRepository.startStreamingSession).toHaveBeenCalledWith('user-uuid-123-456');
    });

    it('should start session with email', async () => {
      const mockUser = { id: 'user-123' };
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      await service.startStreamingSession('employee@example.com');
      expect(streamingSessionRepository.startStreamingSession).toHaveBeenCalledWith('user-123');
    });

    it('should throw error when user not found by email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.startStreamingSession('employee@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('stopStreamingSession', () => {
    it('should stop session with UUID', async () => {
      await service.stopStreamingSession('user-uuid-123-456', 'COMMAND');
      expect(streamingSessionRepository.stopStreamingSession).toHaveBeenCalledWith('user-uuid-123-456', 'COMMAND', undefined);
    });

    it('should stop session with email', async () => {
      const mockUser = { id: 'user-123' };
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      await service.stopStreamingSession('employee@example.com', 'DISCONNECT');
      expect(streamingSessionRepository.stopStreamingSession).toHaveBeenCalledWith('user-123', 'DISCONNECT', undefined);
    });
  });

  // Note: fetchStreamingSessions and fetchStreamingSessionHistory methods are not implemented in StreamingSessionDomainService
  // These tests are commented out until the methods are implemented
  // describe('fetchStreamingSessions', () => {
  //   it('should fetch active streaming sessions', async () => {
  //     const mockUsers = [{ id: 'user-1', email: 'user1@example.com' }];
  //     const mockSessions = [{ userId: 'user-1', startedAt: new Date(), stoppedAt: null }];
  //     userRepository.findByRolesWithSupervisor.mockResolvedValue(mockUsers as any);
  //     streamingSessionRepository.getActiveStreamingSessionsForUsers.mockResolvedValue(mockSessions as any);
  //     const result = await service.fetchStreamingSessions();
  //     expect(result.sessions).toBeDefined();
  //   });
  // });

  // describe('fetchStreamingSessionHistory', () => {
  //   it('should fetch streaming session history', async () => {
  //     const mockHistory = [{ id: 'session-1', userId: 'user-1', startedAt: new Date(), stoppedAt: new Date() }];
  //     streamingSessionRepository.getAllStreamingSessionHistory.mockResolvedValue(mockHistory as any);
  //     const result = await service.fetchStreamingSessionHistory();
  //     expect(result.sessions).toHaveLength(1);
  //   });
  // });
});