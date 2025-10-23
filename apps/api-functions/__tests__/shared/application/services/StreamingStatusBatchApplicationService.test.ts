/**
 * @fileoverview Tests for StreamingStatusBatchApplicationService
 * @description Tests for batch streaming status application service
 */

import { StreamingStatusBatchApplicationService } from '../../../../shared/application/services/StreamingStatusBatchApplicationService';
import { IStreamingSessionRepository } from '../../../../shared/domain/interfaces/IStreamingSessionRepository';
import { AuthorizationService } from '../../../../shared/domain/services/AuthorizationService';
import { StreamingStatusBatchResponse } from '../../../../shared/domain/value-objects/StreamingStatusBatchResponse';
import { StreamingSessionHistory } from '../../../../shared/domain/entities/StreamingSessionHistory';

// Mock dependencies
jest.mock('../../../../shared/domain/interfaces/IStreamingSessionRepository');
jest.mock('../../../../shared/domain/services/AuthorizationService');

describe('StreamingStatusBatchApplicationService', () => {
  let streamingStatusBatchApplicationService: StreamingStatusBatchApplicationService;
  let mockStreamingSessionRepository: jest.Mocked<IStreamingSessionRepository>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockStreamingSessionRepository = {
      getLatestSessionsForEmails: jest.fn()
    } as any;

    mockAuthorizationService = {
      canAccessStreamingStatus: jest.fn()
    } as any;

    streamingStatusBatchApplicationService = new StreamingStatusBatchApplicationService(
      mockStreamingSessionRepository,
      mockAuthorizationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create StreamingStatusBatchApplicationService instance', () => {
      expect(streamingStatusBatchApplicationService).toBeInstanceOf(StreamingStatusBatchApplicationService);
    });
  });

  describe('getBatchStatus', () => {
    it('should get batch status successfully when user is authorized', async () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      const callerId = 'test-caller-id';
      const sessionsData = [
        {
          email: 'user1@example.com',
          session: new StreamingSessionHistory({
            id: 'session-1',
            userId: 'user-1',
            startedAt: new Date('2023-01-01T09:00:00Z'),
            stoppedAt: new Date('2023-01-01T10:00:00Z'),
            stopReason: 'User stopped',
            createdAt: new Date('2023-01-01T09:00:00Z'),
            updatedAt: new Date('2023-01-01T10:00:00Z')
          })
        },
        {
          email: 'user2@example.com',
          session: null
        }
      ];

      mockAuthorizationService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue(sessionsData);

      const result = await streamingStatusBatchApplicationService.getBatchStatus(emails, callerId);

      expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should throw error when user is not authorized', async () => {
      const emails = ['user1@example.com'];
      const callerId = 'test-caller-id';

      const authError = new Error('User not authorized');
      mockAuthorizationService.canAccessStreamingStatus.mockRejectedValue(authError);

      await expect(streamingStatusBatchApplicationService.getBatchStatus(emails, callerId))
        .rejects.toThrow('User not authorized');

      expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).not.toHaveBeenCalled();
    });

    it('should handle sessions with active streaming', async () => {
      const emails = ['user1@example.com'];
      const callerId = 'test-caller-id';
      const sessionsData = [
        {
          email: 'user1@example.com',
          session: new StreamingSessionHistory({
            id: 'session-1',
            userId: 'user-1',
            startedAt: new Date('2023-01-01T09:00:00Z'),
            stoppedAt: null,
            stopReason: null,
            createdAt: new Date('2023-01-01T09:00:00Z'),
            updatedAt: new Date('2023-01-01T09:00:00Z')
          })
        }
      ];

      mockAuthorizationService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue(sessionsData);

      const result = await streamingStatusBatchApplicationService.getBatchStatus(emails, callerId);

      expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should handle sessions with stopped streaming', async () => {
      const emails = ['user1@example.com'];
      const callerId = 'test-caller-id';
      const sessionsData = [
        {
          email: 'user1@example.com',
          session: new StreamingSessionHistory({
            id: 'session-1',
            userId: 'user-1',
            startedAt: new Date('2023-01-01T09:00:00Z'),
            stoppedAt: new Date('2023-01-01T10:00:00Z'),
            stopReason: 'User stopped',
            createdAt: new Date('2023-01-01T09:00:00Z'),
            updatedAt: new Date('2023-01-01T10:00:00Z')
          })
        }
      ];

      mockAuthorizationService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue(sessionsData);

      const result = await streamingStatusBatchApplicationService.getBatchStatus(emails, callerId);

      expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should handle sessions with null stoppedAt', async () => {
      const emails = ['user1@example.com'];
      const callerId = 'test-caller-id';
      const sessionsData = [
        {
          email: 'user1@example.com',
          session: new StreamingSessionHistory({
            id: 'session-1',
            userId: 'user-1',
            startedAt: new Date('2023-01-01T09:00:00Z'),
            stoppedAt: null,
            stopReason: 'User stopped',
            createdAt: new Date('2023-01-01T09:00:00Z'),
            updatedAt: new Date('2023-01-01T09:00:00Z')
          })
        }
      ];

      mockAuthorizationService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue(sessionsData);

      const result = await streamingStatusBatchApplicationService.getBatchStatus(emails, callerId);

      expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should handle empty emails array', async () => {
      const emails: string[] = [];
      const callerId = 'test-caller-id';
      const sessionsData: any[] = [];

      mockAuthorizationService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue(sessionsData);

      const result = await streamingStatusBatchApplicationService.getBatchStatus(emails, callerId);

      expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should propagate repository errors', async () => {
      const emails = ['user1@example.com'];
      const callerId = 'test-caller-id';

      const repositoryError = new Error('Repository error');
      mockAuthorizationService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockRejectedValue(repositoryError);

      await expect(streamingStatusBatchApplicationService.getBatchStatus(emails, callerId))
        .rejects.toThrow('Repository error');

      expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
    });
  });
});
