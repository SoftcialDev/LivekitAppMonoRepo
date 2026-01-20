import { StreamingSessionDomainService } from '../../../src/domain/services/StreamingSessionDomainService';
import { IStreamingSessionRepository } from '../../../src/domain/interfaces/IStreamingSessionRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { StreamingSessionFetchError } from '../../../src/domain/errors/StreamingSessionErrors';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockStreamingSessionRepository, createMockUserRepository, createMockUser, createMockStreamingSessionHistory } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';
import { FetchStreamingSessionHistoryResponse } from '../../../src/domain/value-objects/FetchStreamingSessionHistoryResponse';
import { FetchStreamingSessionsResponse } from '../../../src/domain/value-objects/FetchStreamingSessionsResponse';

describe('StreamingSessionDomainService', () => {
  let service: StreamingSessionDomainService;
  let mockStreamingSessionRepository: jest.Mocked<IStreamingSessionRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockStreamingSessionRepository = createMockStreamingSessionRepository();
    mockUserRepository = createMockUserRepository();
    service = new StreamingSessionDomainService(mockStreamingSessionRepository, mockUserRepository);
  });

  describe('startStreamingSession', () => {
    it('should start streaming session with email', async () => {
      const userId = 'user@example.com';
      const mockUser = createMockUser({ id: 'user-id', email: userId });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockStreamingSessionRepository.startStreamingSession.mockResolvedValue(undefined);

      await service.startStreamingSession(userId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userId);
      expect(mockStreamingSessionRepository.startStreamingSession).toHaveBeenCalledWith('user-id');
    });

    it('should start streaming session with UUID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockStreamingSessionRepository.startStreamingSession.mockResolvedValue(undefined);

      await service.startStreamingSession(userId);

      expect(mockStreamingSessionRepository.startStreamingSession).toHaveBeenCalledWith(userId);
    });

    it('should throw UserNotFoundError when user not found by email', async () => {
      const userId = 'notfound@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.startStreamingSession(userId)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('stopStreamingSession', () => {
    it('should stop streaming session successfully', async () => {
      const userId = 'user@example.com';
      const reason = 'User stopped';
      const mockUser = createMockUser({ id: 'user-id', email: userId });
      const mockSession = createMockStreamingSessionHistory({ id: 'session-id', userId: 'user-id' });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockStreamingSessionRepository.stopStreamingSession.mockResolvedValue(mockSession);

      const result = await service.stopStreamingSession(userId, reason);

      expect(mockStreamingSessionRepository.stopStreamingSession).toHaveBeenCalledWith('user-id', reason, undefined);
      expect(result).toBe(mockSession);
    });
  });

  describe('getLastStreamingSession', () => {
    it('should return last streaming session', async () => {
      const userId = 'user-id';
      const mockSession = createMockStreamingSessionHistory({ id: 'session-id', userId });
      mockStreamingSessionRepository.getLastStreamingSession.mockResolvedValue(mockSession);

      const result = await service.getLastStreamingSession(userId);

      expect(result).toBe(mockSession);
    });
  });

  describe('isUserStreaming', () => {
    it('should return true when user is streaming', async () => {
      const userId = 'user-id';
      mockStreamingSessionRepository.isUserStreaming.mockResolvedValue(true);

      const result = await service.isUserStreaming(userId);

      expect(result).toBe(true);
    });
  });

  describe('fetchLatestSessionForUser', () => {
    it('should return session when found', async () => {
      const callerId = 'caller-id';
      const mockUser = createMockUser({ id: 'user-id', azureAdObjectId: callerId });
      const mockSession = createMockStreamingSessionHistory({ id: 'session-id', userId: 'user-id' });
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);
      mockStreamingSessionRepository.getLatestSessionForUser.mockResolvedValue(mockSession);

      const result = await service.fetchLatestSessionForUser(callerId);

      expect(result.session).toBe(mockSession);
    });

    it('should return no session when not found', async () => {
      const callerId = 'caller-id';
      const mockUser = createMockUser({ id: 'user-id', azureAdObjectId: callerId });
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);
      mockStreamingSessionRepository.getLatestSessionForUser.mockResolvedValue(null);

      const result = await service.fetchLatestSessionForUser(callerId);

      expect(result.session).toBeNull();
    });

    it('should throw StreamingSessionFetchError on error', async () => {
      const callerId = 'caller-id';
      mockUserRepository.findByAzureAdObjectId.mockRejectedValue(new Error('DB error'));

      await expect(service.fetchLatestSessionForUser(callerId)).rejects.toThrow(StreamingSessionFetchError);
    });
  });

  describe('getAllActiveSessions', () => {
    it('should return all sessions for Admin', async () => {
      const callerId = 'admin-id';
      const mockUser = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });
      const mockSessions = [createMockStreamingSessionHistory({ id: 'session-1' })];
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);
      mockStreamingSessionRepository.getActiveSessions.mockResolvedValue(mockSessions);

      const result = await service.getAllActiveSessions(callerId);

      expect(result.sessions).toEqual(mockSessions);
    });

    it('should return supervisor sessions for Supervisor', async () => {
      const callerId = 'supervisor-id';
      const mockUser = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Supervisor });
      const mockSessions = [createMockStreamingSessionHistory({ id: 'session-1' })];
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);
      mockStreamingSessionRepository.getActiveSessionsForSupervisor.mockResolvedValue(mockSessions);

      const result = await service.getAllActiveSessions(callerId);

      expect(result.sessions).toEqual(mockSessions);
    });

    it('should return no sessions for invalid role', async () => {
      const callerId = 'pso-id';
      const mockUser = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);

      const result = await service.getAllActiveSessions(callerId);

      expect(result.sessions).toEqual([]);
    });
  });
});






