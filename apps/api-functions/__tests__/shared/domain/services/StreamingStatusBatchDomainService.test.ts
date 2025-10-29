/**
 * @fileoverview Tests for StreamingStatusBatchDomainService
 * @description Tests for batch streaming status domain service
 */

import { StreamingStatusBatchDomainService } from '../../../../shared/domain/services/StreamingStatusBatchDomainService';
import { StreamingStatusBatchResponse } from '../../../../shared/domain/value-objects/StreamingStatusBatchResponse';
import { IStreamingSessionRepository } from '../../../../shared/domain/interfaces/IStreamingSessionRepository';

describe('StreamingStatusBatchDomainService', () => {
  let service: StreamingStatusBatchDomainService;
  let mockRepository: jest.Mocked<IStreamingSessionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      getLatestSessionsForEmails: jest.fn(),
    } as any;

    service = new StreamingStatusBatchDomainService(mockRepository);
  });

  describe('constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(StreamingStatusBatchDomainService);
    });
  });

  describe('getBatchStreamingStatus', () => {
    it('should return batch status with active sessions', async () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      const mockSessions = [
        { email: 'user1@example.com', session: { stopReason: null, stoppedAt: null } },
        { email: 'user2@example.com', session: { stopReason: null, stoppedAt: null } },
      ];

      mockRepository.getLatestSessionsForEmails.mockResolvedValue(mockSessions as any);

      const result = await service.getBatchStreamingStatus(emails);

      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
      expect(mockRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
    });

    it('should return batch status with stopped sessions', async () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      const now = new Date();
      const mockSessions = [
        { email: 'user1@example.com', session: { stopReason: 'manual', stoppedAt: now } },
        { email: 'user2@example.com', session: { stopReason: 'timeout', stoppedAt: now } },
      ];

      mockRepository.getLatestSessionsForEmails.mockResolvedValue(mockSessions as any);

      const result = await service.getBatchStreamingStatus(emails);

      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should return batch status with mixed active and stopped sessions', async () => {
      const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const now = new Date();
      const mockSessions = [
        { email: 'user1@example.com', session: { stopReason: null, stoppedAt: null } },
        { email: 'user2@example.com', session: { stopReason: 'manual', stoppedAt: now } },
        { email: 'user3@example.com', session: null },
      ];

      mockRepository.getLatestSessionsForEmails.mockResolvedValue(mockSessions as any);

      const result = await service.getBatchStreamingStatus(emails);

      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should handle empty sessions array', async () => {
      const emails = ['user1@example.com'];
      mockRepository.getLatestSessionsForEmails.mockResolvedValue([
        { email: 'user1@example.com', session: null }
      ] as any);

      const result = await service.getBatchStreamingStatus(emails);

      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });

    it('should handle empty emails array', async () => {
      mockRepository.getLatestSessionsForEmails.mockResolvedValue([]);

      const result = await service.getBatchStreamingStatus([]);

      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
    });
  });
});

