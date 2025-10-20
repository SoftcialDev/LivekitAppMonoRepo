/**
 * @fileoverview FetchStreamingSessionsApplicationService - unit tests
 */

import { FetchStreamingSessionsApplicationService } from '../../../../../shared/application/services/FetchStreamingSessionsApplicationService';

describe('FetchStreamingSessionsApplicationService', () => {
  let service: FetchStreamingSessionsApplicationService;
  let mockDomainService: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockDomainService = {
      getAllActiveSessions: jest.fn()
    };
    mockAuthService = {
      canSendCommands: jest.fn()
    };
    service = new FetchStreamingSessionsApplicationService(mockDomainService, mockAuthService);
  });

  describe('fetchStreamingSessions', () => {
    it('authorizes and delegates to domain service', async () => {
      const callerId = 'caller123';
      const expectedResult = { sessions: [] } as any;
      
      mockAuthService.canSendCommands.mockResolvedValue(undefined);
      mockDomainService.getAllActiveSessions.mockResolvedValue(expectedResult);

      const result = await service.fetchStreamingSessions(callerId);

      expect(mockAuthService.canSendCommands).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.getAllActiveSessions).toHaveBeenCalledWith(callerId);
      expect(result).toBe(expectedResult);
    });
  });
});
