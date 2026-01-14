import { TalkSessionDomainService } from '../../../src/domain/services/TalkSessionDomainService';
import { ITalkSessionRepository } from '../../../src/domain/interfaces/ITalkSessionRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { TalkSessionStartRequest } from '../../../src/domain/value-objects/TalkSessionStartRequest';
import { TalkSessionStartResponse } from '../../../src/domain/value-objects/TalkSessionStartResponse';
import { TalkSessionStopRequest } from '../../../src/domain/value-objects/TalkSessionStopRequest';
import { TalkSessionStopResponse } from '../../../src/domain/value-objects/TalkSessionStopResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { TalkSessionAlreadyActiveError } from '../../../src/domain/errors/TalkSessionErrors';
import { createMockUserRepository, createMockTalkSessionRepository, createMockWebPubSubService, createMockUser, createMockSupervisor } from './domainServiceTestSetup';
import { TalkStopReason } from '../../../src/domain/enums/TalkStopReason';

describe('TalkSessionDomainService', () => {
  let service: TalkSessionDomainService;
  let mockTalkSessionRepository: jest.Mocked<ITalkSessionRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockTalkSessionRepository = createMockTalkSessionRepository();
    mockUserRepository = createMockUserRepository();
    mockWebPubSubService = createMockWebPubSubService();
    service = new TalkSessionDomainService(
      mockTalkSessionRepository,
      mockUserRepository,
      mockWebPubSubService
    );
  });

  describe('startTalkSession', () => {
    it('should start talk session successfully', async () => {
      const request = new TalkSessionStartRequest('caller-id', 'pso@example.com');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const talkSession = {
        id: 'session-id',
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: new Date(),
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockTalkSessionRepository.getActiveTalkSessionsForPso.mockResolvedValue([]);
      mockTalkSessionRepository.createTalkSession.mockResolvedValue(talkSession as any);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.startTalkSession(request);

      expect(mockTalkSessionRepository.createTalkSession).toHaveBeenCalled();
      expect(result.talkSessionId).toBe('session-id');
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalled();
    });

    it('should throw error when supervisor not found', async () => {
      const request = new TalkSessionStartRequest('caller-id', 'pso@example.com');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.startTalkSession(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when PSO not found', async () => {
      const request = new TalkSessionStartRequest('caller-id', 'pso@example.com');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.startTalkSession(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when PSO already has active session', async () => {
      const request = new TalkSessionStartRequest('caller-id', 'pso@example.com');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const activeSession = {
        id: 'existing-session-id',
        supervisorId: 'other-supervisor-id',
        psoId: 'pso-id',
      };
      const otherSupervisor = createMockSupervisor({
        id: 'other-supervisor-id',
        email: 'other@example.com',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockTalkSessionRepository.getActiveTalkSessionsForPso.mockResolvedValue([activeSession] as any);
      mockUserRepository.findById.mockResolvedValue(otherSupervisor);

      await expect(service.startTalkSession(request)).rejects.toThrow(TalkSessionAlreadyActiveError);
    });
  });

  describe('stopTalkSession', () => {
    it('should stop talk session successfully', async () => {
      const request = new TalkSessionStopRequest('session-id', TalkStopReason.USER_STOP);
      const sessionWithPso = {
        id: 'session-id',
        psoEmail: 'pso@example.com',
      };

      mockTalkSessionRepository.findByIdWithPso.mockResolvedValue(sessionWithPso as any);
      mockTalkSessionRepository.stopTalkSession.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.stopTalkSession(request);

      expect(mockTalkSessionRepository.stopTalkSession).toHaveBeenCalledWith('session-id', TalkStopReason.USER_STOP);
      expect(result.message).toContain('stopped');
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalled();
    });

    it('should stop session even when PSO info not found', async () => {
      const request = new TalkSessionStopRequest('session-id', TalkStopReason.USER_STOP);

      mockTalkSessionRepository.findByIdWithPso.mockResolvedValue(null);
      mockTalkSessionRepository.stopTalkSession.mockResolvedValue(undefined);

      const result = await service.stopTalkSession(request);

      expect(mockTalkSessionRepository.stopTalkSession).toHaveBeenCalled();
      expect(mockWebPubSubService.broadcastMessage).not.toHaveBeenCalled();
    });
  });
});

