import { GetActiveTalkSessionDomainService } from '../../../src/domain/services/GetActiveTalkSessionDomainService';
import { ITalkSessionRepository } from '../../../src/domain/interfaces/ITalkSessionRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { GetActiveTalkSessionRequest } from '../../../src/domain/value-objects/GetActiveTalkSessionRequest';
import { GetActiveTalkSessionResponse } from '../../../src/domain/value-objects/GetActiveTalkSessionResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockTalkSessionRepository, createMockUser, createMockSupervisor } from './domainServiceTestSetup';

describe('GetActiveTalkSessionDomainService', () => {
  let service: GetActiveTalkSessionDomainService;
  let mockTalkSessionRepository: jest.Mocked<ITalkSessionRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockTalkSessionRepository = createMockTalkSessionRepository();
    mockUserRepository = createMockUserRepository();
    service = new GetActiveTalkSessionDomainService(mockTalkSessionRepository, mockUserRepository);
  });

  describe('getActiveTalkSession', () => {
    it('should return active talk session when found', async () => {
      const request = new GetActiveTalkSessionRequest('caller-id', 'pso@example.com');
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
      });
      const activeSession = {
        id: 'session-id',
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockTalkSessionRepository.getActiveTalkSessionsForPso.mockResolvedValue([activeSession] as any);
      mockUserRepository.findById.mockResolvedValue(supervisor);

      const result = await service.getActiveTalkSession(request);

      expect(result.hasActiveSession).toBe(true);
      expect(result.sessionId).toBe('session-id');
      expect(result.supervisorEmail).toBe('supervisor@example.com');
      expect(result.supervisorName).toBe('Supervisor Name');
    });

    it('should return no active session when none found', async () => {
      const request = new GetActiveTalkSessionRequest('caller-id', 'pso@example.com');
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockTalkSessionRepository.getActiveTalkSessionsForPso.mockResolvedValue([]);

      const result = await service.getActiveTalkSession(request);

      expect(result.hasActiveSession).toBe(false);
      expect(result.sessionId).toBeUndefined();
    });

    it('should throw error when PSO not found', async () => {
      const request = new GetActiveTalkSessionRequest('caller-id', 'pso@example.com');

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.getActiveTalkSession(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should handle missing supervisor information', async () => {
      const request = new GetActiveTalkSessionRequest('caller-id', 'pso@example.com');
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const activeSession = {
        id: 'session-id',
        supervisorId: 'non-existent-supervisor',
        psoId: 'pso-id',
        startedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockTalkSessionRepository.getActiveTalkSessionsForPso.mockResolvedValue([activeSession] as any);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getActiveTalkSession(request);

      expect(result.hasActiveSession).toBe(true);
      expect(result.supervisorEmail).toBeUndefined();
      expect(result.supervisorName).toBeUndefined();
    });
  });
});






