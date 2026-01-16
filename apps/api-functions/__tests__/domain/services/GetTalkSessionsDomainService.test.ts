import { GetTalkSessionsDomainService } from '../../../src/domain/services/GetTalkSessionsDomainService';
import { ITalkSessionRepository } from '../../../src/domain/interfaces/ITalkSessionRepository';
import { GetTalkSessionsRequest } from '../../../src/domain/value-objects/GetTalkSessionsRequest';
import { GetTalkSessionsResponse } from '../../../src/domain/value-objects/GetTalkSessionsResponse';
import { createMockTalkSessionRepository } from './domainServiceTestSetup';

describe('GetTalkSessionsDomainService', () => {
  let service: GetTalkSessionsDomainService;
  let mockTalkSessionRepository: jest.Mocked<ITalkSessionRepository>;

  beforeEach(() => {
    mockTalkSessionRepository = createMockTalkSessionRepository();
    service = new GetTalkSessionsDomainService(mockTalkSessionRepository);
  });

  describe('getTalkSessions', () => {
    it('should return talk sessions with pagination', async () => {
      const request = new GetTalkSessionsRequest('caller-id', 1, 10);
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            supervisorId: 'supervisor-1',
            supervisor: { fullName: 'Supervisor One', email: 'supervisor1@example.com' },
            psoId: 'pso-1',
            pso: { fullName: 'PSO One', email: 'pso1@example.com' },
            startedAt: new Date('2024-01-01'),
            stoppedAt: null,
            stopReason: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        total: 1,
      };

      mockTalkSessionRepository.getAllTalkSessionsWithRelations.mockResolvedValue(mockSessions as any);

      const result = await service.getTalkSessions(request);

      expect(mockTalkSessionRepository.getAllTalkSessionsWithRelations).toHaveBeenCalledWith(1, 10);
      expect(result.toPayload().sessions).toHaveLength(1);
      expect(result.toPayload().sessions[0].id).toBe('session-1');
      expect(result.toPayload().total).toBe(1);
    });

    it('should handle empty sessions list', async () => {
      const request = new GetTalkSessionsRequest('caller-id', 1, 10);

      mockTalkSessionRepository.getAllTalkSessionsWithRelations.mockResolvedValue({
        sessions: [],
        total: 0,
      } as any);

      const result = await service.getTalkSessions(request);

      expect(result.toPayload().sessions).toEqual([]);
      expect(result.toPayload().total).toBe(0);
    });

    it('should format dates correctly', async () => {
      const request = new GetTalkSessionsRequest('caller-id', 1, 10);
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const stoppedAt = new Date('2024-01-01T11:00:00Z');
      const mockSessions = {
        sessions: [
          {
            id: 'session-1',
            supervisorId: 'supervisor-1',
            supervisor: { fullName: 'Supervisor', email: 'supervisor@example.com' },
            psoId: 'pso-1',
            pso: { fullName: 'PSO', email: 'pso@example.com' },
            startedAt,
            stoppedAt,
            stopReason: 'USER_STOP',
            createdAt: startedAt,
            updatedAt: stoppedAt,
          },
        ],
        total: 1,
      };

      mockTalkSessionRepository.getAllTalkSessionsWithRelations.mockResolvedValue(mockSessions as any);

      const result = await service.getTalkSessions(request);

      expect(result.toPayload().sessions[0].startedAt).toBe(startedAt.toISOString());
      expect(result.toPayload().sessions[0].stoppedAt).toBe(stoppedAt.toISOString());
    });
  });
});



