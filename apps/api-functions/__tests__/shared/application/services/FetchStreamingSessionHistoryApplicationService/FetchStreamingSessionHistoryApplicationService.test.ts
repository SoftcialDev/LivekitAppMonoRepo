/**
 * @fileoverview FetchStreamingSessionHistoryApplicationService - unit tests
 * @summary Tests for FetchStreamingSessionHistoryApplicationService functionality
 * @description Validates streaming session history operations, authorization, and business logic
 */

import { FetchStreamingSessionHistoryApplicationService } from '../../../../../shared/application/services/FetchStreamingSessionHistoryApplicationService';
import { IStreamingSessionDomainService } from '../../../../../shared/domain/interfaces/IStreamingSessionDomainService';
import { AuthorizationService } from '../../../../../shared/domain/services/AuthorizationService';
import { FetchStreamingSessionHistoryResponse } from '../../../../../shared/domain/value-objects/FetchStreamingSessionHistoryResponse';
import { StreamingSessionAccessDeniedError } from '../../../../../shared/domain/errors/StreamingSessionErrors';

// Mock dependencies
const mockStreamingSessionDomainService: jest.Mocked<IStreamingSessionDomainService> = {
  fetchLatestSessionForUser: jest.fn(),
  getAllActiveSessions: jest.fn()
};

const mockAuthorizationService: jest.Mocked<AuthorizationService> = {
  canAccessContactManager: jest.fn(),
  authorizeUserQuery: jest.fn(),
  authorizeUserWithRoles: jest.fn(),
  canAccessAdmin: jest.fn(),
  canManageUsers: jest.fn(),
  canManageSupervisors: jest.fn(),
  canAccessUserData: jest.fn(),
  canManageContactManagers: jest.fn(),
  canManageSuperAdmins: jest.fn(),
  canDeleteUsers: jest.fn(),
  canChangeUserRoles: jest.fn(),
  canChangeSupervisors: jest.fn()
} as any;

describe('FetchStreamingSessionHistoryApplicationService', () => {
  let service: FetchStreamingSessionHistoryApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FetchStreamingSessionHistoryApplicationService(
      mockStreamingSessionDomainService,
      mockAuthorizationService
    );
  });

  describe('constructor', () => {
    it('should create service with dependencies', () => {
      expect(service).toBeInstanceOf(FetchStreamingSessionHistoryApplicationService);
    });
  });

  describe('fetchStreamingSessionHistory', () => {
    it('should return streaming session history when user is authorized', async () => {
      const callerId = 'user-123';

      const mockSession = {
        id: 'session-1',
        userId: 'user-123',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: new Date('2023-01-01T11:00:00Z'),
        stopReason: 'completed',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      } as any;

      const expectedResponse = new FetchStreamingSessionHistoryResponse(mockSession);

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockResolvedValue(expectedResponse);

      const result = await service.fetchStreamingSessionHistory(callerId);

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionDomainService.fetchLatestSessionForUser).toHaveBeenCalledWith(callerId);
      expect(result).toBe(expectedResponse);
    });

    it('should return empty history when user has no sessions', async () => {
      const callerId = 'user-123';

      const expectedResponse = new FetchStreamingSessionHistoryResponse(null);

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockResolvedValue(expectedResponse);

      const result = await service.fetchStreamingSessionHistory(callerId);

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionDomainService.fetchLatestSessionForUser).toHaveBeenCalledWith(callerId);
      expect(result).toBe(expectedResponse);
      expect(result.session).toBeNull();
      // No additional assertions needed for null session
    });

    it('should return history with active session', async () => {
      const callerId = 'user-123';

      const mockSession = {
        id: 'session-active',
        userId: 'user-123',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: null,
        stopReason: null,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z')
      } as any;

      const expectedResponse = new FetchStreamingSessionHistoryResponse(mockSession);

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockResolvedValue(expectedResponse);

      const result = await service.fetchStreamingSessionHistory(callerId);

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionDomainService.fetchLatestSessionForUser).toHaveBeenCalledWith(callerId);
      expect(result).toBe(expectedResponse);
      expect(result.session?.stoppedAt).toBeNull();
    });

    it('should throw StreamingSessionAccessDeniedError when user is not authorized', async () => {
      const callerId = 'user-123';

      mockAuthorizationService.canAccessContactManager.mockRejectedValue(new StreamingSessionAccessDeniedError('Insufficient privileges'));

      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow(StreamingSessionAccessDeniedError);
      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow('Insufficient privileges');

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionDomainService.fetchLatestSessionForUser).not.toHaveBeenCalled();
    });

    it('should throw error when user is not found', async () => {
      const callerId = 'non-existent-user';

      mockAuthorizationService.canAccessContactManager.mockRejectedValue(new Error('User not found'));

      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow('User not found');

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionDomainService.fetchLatestSessionForUser).not.toHaveBeenCalled();
    });

    it('should handle domain service errors', async () => {
      const callerId = 'user-123';

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow('Database connection failed');

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionDomainService.fetchLatestSessionForUser).toHaveBeenCalledWith(callerId);
    });

    it('should handle authorization timeout', async () => {
      const callerId = 'user-123';

      mockAuthorizationService.canAccessContactManager.mockRejectedValue(new Error('Authorization timeout'));

      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow('Authorization timeout');

      expect(mockAuthorizationService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionDomainService.fetchLatestSessionForUser).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate authorization errors', async () => {
      const callerId = 'user-123';

      mockAuthorizationService.canAccessContactManager.mockRejectedValue(new Error('Invalid token'));

      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow('Invalid token');
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'user-123';

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockRejectedValue(new Error('Streaming service unavailable'));

      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow('Streaming service unavailable');
    });

    it('should handle network errors', async () => {
      const callerId = 'user-123';

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockRejectedValue(new Error('Network timeout'));

      await expect(service.fetchStreamingSessionHistory(callerId)).rejects.toThrow('Network timeout');
    });
  });

  describe('edge cases', () => {
    it('should handle large session history', async () => {
      const callerId = 'user-123';

      const mockSession = {
        id: 'session-0',
        userId: 'user-123',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: new Date('2023-01-01T11:00:00Z'),
        stopReason: 'completed',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      } as any;

      const expectedResponse = new FetchStreamingSessionHistoryResponse(mockSession);

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockResolvedValue(expectedResponse);

      const result = await service.fetchStreamingSessionHistory(callerId);

      expect(result).toBe(expectedResponse);
      expect(result.session).toBeDefined();
      expect(result.session).toBeDefined();
    });

    it('should handle sessions with different statuses', async () => {
      const callerId = 'user-123';

      const mockSession = {
        id: 'session-completed',
        userId: 'user-123',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: new Date('2023-01-01T11:00:00Z'),
        stopReason: 'completed',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      } as any;

      const expectedResponse = new FetchStreamingSessionHistoryResponse(mockSession);

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockResolvedValue(expectedResponse);

      const result = await service.fetchStreamingSessionHistory(callerId);

      expect(result).toBe(expectedResponse);
      expect(result.session?.id).toBe('session-completed');
    });

    it('should handle sessions without supervisor information', async () => {
      const callerId = 'user-123';

      const mockSession = {
        id: 'session-no-supervisor',
        userId: 'user-123',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: new Date('2023-01-01T11:00:00Z'),
        stopReason: 'completed',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      } as any;

      const expectedResponse = new FetchStreamingSessionHistoryResponse(mockSession);

      mockAuthorizationService.canAccessContactManager.mockResolvedValue();
      mockStreamingSessionDomainService.fetchLatestSessionForUser.mockResolvedValue(expectedResponse);

      const result = await service.fetchStreamingSessionHistory(callerId);

      expect(result).toBe(expectedResponse);
      expect(result.session?.id).toBe('session-no-supervisor');
    });
  });
});
