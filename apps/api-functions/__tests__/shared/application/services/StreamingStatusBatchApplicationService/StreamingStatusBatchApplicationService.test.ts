/**
 * @fileoverview StreamingStatusBatchApplicationService - unit tests
 */

import { StreamingStatusBatchApplicationService } from '../../../../../shared/application/services/StreamingStatusBatchApplicationService';

describe('StreamingStatusBatchApplicationService', () => {
  let service: StreamingStatusBatchApplicationService;
  let mockRepository: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockRepository = {
      getLatestSessionsForEmails: jest.fn()
    };
    mockAuthService = {
      canAccessStreamingStatus: jest.fn()
    };
    service = new StreamingStatusBatchApplicationService(mockRepository, mockAuthService);
  });

  describe('getBatchStatus', () => {
    it('authorizes and returns batch status for multiple emails', async () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      const callerId = 'caller123';
      const sessionsData = [
        { email: 'user1@example.com', session: { stoppedAt: null, stopReason: null } },
        { email: 'user2@example.com', session: null }
      ];
      
      mockAuthService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockRepository.getLatestSessionsForEmails.mockResolvedValue(sessionsData);

      const result = await service.getBatchStatus(emails, callerId);

      expect(mockAuthService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
      expect(mockRepository.getLatestSessionsForEmails).toHaveBeenCalledWith(emails);
      expect(result).toBeDefined();
      expect(result.statuses).toHaveLength(2);
    });

    it('handles sessions with stoppedAt timestamp', async () => {
      const emails = ['user1@example.com'];
      const callerId = 'caller123';
      const stoppedAt = new Date('2023-01-01T10:00:00Z');
      const sessionsData = [
        { 
          email: 'user1@example.com', 
          session: { 
            stoppedAt, 
            stopReason: 'Manual stop' 
          } 
        }
      ];
      
      mockAuthService.canAccessStreamingStatus.mockResolvedValue(undefined);
      mockRepository.getLatestSessionsForEmails.mockResolvedValue(sessionsData);

      const result = await service.getBatchStatus(emails, callerId);

      expect(result.statuses[0]).toEqual({
        email: 'user1@example.com',
        hasActiveSession: false,
        lastSession: {
          stopReason: 'Manual stop',
          stoppedAt: '2023-01-01T10:00:00.000Z'
        }
      });
    });
  });
});
