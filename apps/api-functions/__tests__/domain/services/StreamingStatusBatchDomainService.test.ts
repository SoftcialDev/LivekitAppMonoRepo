import { StreamingStatusBatchDomainService } from '../../../src/domain/services/StreamingStatusBatchDomainService';
import { IStreamingSessionRepository } from '../../../src/domain/interfaces/IStreamingSessionRepository';
import { StreamingStatusBatchResponse } from '../../../src/domain/value-objects/StreamingStatusBatchResponse';
import { createMockStreamingSessionRepository, createMockStreamingSessionHistory } from './domainServiceTestSetup';

describe('StreamingStatusBatchDomainService', () => {
  let service: StreamingStatusBatchDomainService;
  let mockStreamingSessionRepository: jest.Mocked<IStreamingSessionRepository>;

  beforeEach(() => {
    mockStreamingSessionRepository = createMockStreamingSessionRepository();
    service = new StreamingStatusBatchDomainService(mockStreamingSessionRepository);
  });

  describe('getBatchStreamingStatus', () => {
    it('should return batch streaming status with active sessions', async () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      const mockSessions = [
        { email: 'user1@example.com', session: createMockStreamingSessionHistory({ id: 'session-1', userId: 'user-1', stoppedAt: new Date() }) },
        { email: 'user2@example.com', session: createMockStreamingSessionHistory({ id: 'session-2', userId: 'user-2', stoppedAt: null }) },
      ];
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue(mockSessions);

      const result = await service.getBatchStreamingStatus(emails);

      expect(mockStreamingSessionRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
      expect(result).toBeInstanceOf(StreamingStatusBatchResponse);
      expect(result.statuses).toHaveLength(2);
      expect(result.statuses[0].hasActiveSession).toBe(false);
      expect(result.statuses[1].hasActiveSession).toBe(true);
    });

    it('should return batch streaming status with no sessions', async () => {
      const emails = ['user1@example.com'];
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue([
        { email: 'user1@example.com', session: null },
      ]);

      const result = await service.getBatchStreamingStatus(emails);

      expect(result.statuses).toHaveLength(1);
      expect(result.statuses[0].hasActiveSession).toBe(false);
      expect(result.statuses[0].lastSession).toBeNull();
    });

    it('should handle empty emails array', async () => {
      mockStreamingSessionRepository.getLatestSessionsForEmails.mockResolvedValue([]);

      const result = await service.getBatchStreamingStatus([]);

      expect(result.statuses).toHaveLength(0);
    });
  });
});

