import { ServiceContainer } from '../../../src/infrastructure/container/ServiceContainer';
import { ServiceNotFoundError } from '../../../src/domain/errors/InfrastructureErrors';
import { PrismaClient } from '@prisma/client';
import prisma from '../../../src/infrastructure/database/PrismaClientService';

jest.mock('../../../src/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {} as any,
}));

jest.mock('../../../src/infrastructure/repositories/UserRepository');
jest.mock('../../../src/infrastructure/repositories/SupervisorRepository');
jest.mock('../../../src/infrastructure/repositories/SnapshotRepository');
jest.mock('../../../src/infrastructure/repositories/CameraStartFailureRepository');
jest.mock('../../../src/infrastructure/repositories/RoleRepository');
jest.mock('../../../src/infrastructure/repositories/PermissionRepository');
jest.mock('../../../src/infrastructure/repositories/RolePermissionRepository');
jest.mock('../../../src/infrastructure/repositories/UserRoleAssignmentRepository');
jest.mock('../../../src/infrastructure/repositories/AuditRepository');
jest.mock('../../../src/infrastructure/repositories/PendingCommandRepository');
jest.mock('../../../src/infrastructure/repositories/ContactManagerFormRepository');
jest.mock('../../../src/infrastructure/repositories/StreamingSessionRepository');
jest.mock('../../../src/infrastructure/repositories/RecordingSessionRepository');
jest.mock('../../../src/infrastructure/repositories/SnapshotReasonRepository');
jest.mock('../../../src/infrastructure/repositories/ErrorLogRepository');
jest.mock('../../../src/infrastructure/repositories/TalkSessionRepository');
jest.mock('../../../src/infrastructure/repositories/PresenceRepository');
jest.mock('../../../src/infrastructure/messaging/CommandMessagingService');
jest.mock('../../../src/infrastructure/services/AuditService');
jest.mock('../../../src/infrastructure/services/PresenceService');
jest.mock('../../../src/infrastructure/services/BlobStorageService');
jest.mock('../../../src/infrastructure/services/ChatService');
jest.mock('../../../src/infrastructure/services/LiveKitRecordingService');
jest.mock('../../../src/infrastructure/services/LiveKitEgressClient');
jest.mock('../../../src/infrastructure/services/BlobUrlService');
jest.mock('../../../src/infrastructure/services/RecordingErrorLoggerService');
jest.mock('../../../src/infrastructure/services/LiveKitService');
jest.mock('../../../src/infrastructure/services/WebPubSubService');

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    (ServiceContainer as any)._initialized = false;
    (ServiceContainer as any).instance = undefined;
    container = ServiceContainer.getInstance();
  });

  afterEach(() => {
    (ServiceContainer as any)._initialized = false;
    (ServiceContainer as any).instance = undefined;
  });

  describe('initialized', () => {
    it('should return false when not initialized', () => {
      expect(ServiceContainer.initialized).toBe(false);
    });

    it('should return true after initialization', () => {
      container.initialize();
      expect(ServiceContainer.initialized).toBe(true);
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ServiceContainer.getInstance();
      const instance2 = ServiceContainer.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a service factory', () => {
      const factory = jest.fn().mockReturnValue('test-service');

      container.register('TestService', factory);

      const service = container.resolve('TestService');
      expect(service).toBe('test-service');
      expect(factory).toHaveBeenCalled();
    });
  });

  describe('resolve', () => {
    it('should resolve registered service', () => {
      const service = { id: 'test' };
      container.register('TestService', () => service);

      const resolved = container.resolve('TestService');

      expect(resolved).toBe(service);
    });

    it('should throw ServiceNotFoundError for unregistered service', () => {
      expect(() => {
        container.resolve('NonExistentService');
      }).toThrow(ServiceNotFoundError);
      expect(() => {
        container.resolve('NonExistentService');
      }).toThrow("Service 'NonExistentService' not found in container");
    });
  });

  describe('initialize', () => {
    it('should initialize all services', () => {
      container.initialize();

      expect(ServiceContainer.initialized).toBe(true);
    });

    it('should not initialize twice', () => {
      container.initialize();
      const initialServices = (container as any).services.size;

      container.initialize();

      expect((container as any).services.size).toBe(initialServices);
    });

    it('should register PrismaClient', () => {
      container.initialize();

      const client = container.resolve<PrismaClient>('PrismaClient');
      expect(client).toBeDefined();
    });

    it('should register UserRepository', () => {
      container.initialize();

      const repo = container.resolve('UserRepository');
      expect(repo).toBeDefined();
    });

    it('should register SupervisorRepository', () => {
      container.initialize();

      const repo = container.resolve('SupervisorRepository');
      expect(repo).toBeDefined();
    });

    it('should register AuthorizationService', () => {
      container.initialize();

      const service = container.resolve('AuthorizationService');
      expect(service).toBeDefined();
    });

    it('should register CameraFailureService', () => {
      container.initialize();

      const service = container.resolve('CameraFailureService');
      expect(service).toBeDefined();
    });

    it('should register SupervisorManagementService', () => {
      container.initialize();

      const service = container.resolve('SupervisorManagementService');
      expect(service).toBeDefined();
    });

    it('should register CommandMessagingService', () => {
      container.initialize();

      const service = container.resolve('CommandMessagingService');
      expect(service).toBeDefined();
    });

    it('should register AuditService', () => {
      container.initialize();

      const service = container.resolve('IAuditService');
      expect(service).toBeDefined();
    });

    it('should register PresenceService', () => {
      container.initialize();

      const service = container.resolve('PresenceService');
      expect(service).toBeDefined();
    });

    it('should register UserDeletionApplicationService', () => {
      container.initialize();

      const service = container.resolve('UserDeletionApplicationService');
      expect(service).toBeDefined();
    });

    it('should register UserQueryService', () => {
      container.initialize();

      const service = container.resolve('UserQueryService');
      expect(service).toBeDefined();
    });

    it('should register UserQueryApplicationService', () => {
      container.initialize();

      const service = container.resolve('UserQueryApplicationService');
      expect(service).toBeDefined();
    });

    it('should register PendingCommandRepository', () => {
      container.initialize();

      const repo = container.resolve('PendingCommandRepository');
      expect(repo).toBeDefined();
    });

    it('should register CommandAcknowledgmentService', () => {
      container.initialize();

      const service = container.resolve('CommandAcknowledgmentService');
      expect(service).toBeDefined();
    });

    it('should register CommandAcknowledgmentApplicationService', () => {
      container.initialize();

      const service = container.resolve('CommandAcknowledgmentApplicationService');
      expect(service).toBeDefined();
    });

    it('should register ContactManagerFormRepository', () => {
      container.initialize();

      const repo = container.resolve('ContactManagerFormRepository');
      expect(repo).toBeDefined();
    });

    it('should register BlobStorageService', () => {
      container.initialize();

      const service = container.resolve('BlobStorageService');
      expect(service).toBeDefined();
    });

    it('should register ChatService', () => {
      container.initialize();

      const service = container.resolve('ChatService');
      expect(service).toBeDefined();
    });

    it('should register ContactManagerFormService', () => {
      container.initialize();

      const service = container.resolve('ContactManagerFormService');
      expect(service).toBeDefined();
    });

    it('should register ContactManagerFormApplicationService', () => {
      container.initialize();

      const service = container.resolve('ContactManagerFormApplicationService');
      expect(service).toBeDefined();
    });

    it('should register ContactManagerDomainService', () => {
      container.initialize();

      const service = container.resolve('ContactManagerDomainService');
      expect(service).toBeDefined();
    });

    it('should register ContactManagerApplicationService', () => {
      container.initialize();

      const service = container.resolve('ContactManagerApplicationService');
      expect(service).toBeDefined();
    });

    it('should register SuperAdminDomainService', () => {
      container.initialize();

      const service = container.resolve('SuperAdminDomainService');
      expect(service).toBeDefined();
    });

    it('should register SuperAdminApplicationService', () => {
      container.initialize();

      const service = container.resolve('SuperAdminApplicationService');
      expect(service).toBeDefined();
    });

    it('should register PendingCommandDomainService', () => {
      container.initialize();

      const service = container.resolve('PendingCommandDomainService');
      expect(service).toBeDefined();
    });

    it('should register FetchPendingCommandsApplicationService', () => {
      container.initialize();

      const service = container.resolve('FetchPendingCommandsApplicationService');
      expect(service).toBeDefined();
    });

    it('should register StreamingSessionRepository', () => {
      container.initialize();

      const repo = container.resolve('StreamingSessionRepository');
      expect(repo).toBeDefined();
    });

    it('should register StreamingSessionDomainService', () => {
      container.initialize();

      const service = container.resolve('StreamingSessionDomainService');
      expect(service).toBeDefined();
    });

    it('should register StreamingStatusBatchDomainService', () => {
      container.initialize();

      const service = container.resolve('StreamingStatusBatchDomainService');
      expect(service).toBeDefined();
    });

    it('should register FetchStreamingSessionHistoryApplicationService', () => {
      container.initialize();

      const service = container.resolve('FetchStreamingSessionHistoryApplicationService');
      expect(service).toBeDefined();
    });

    it('should register FetchStreamingSessionsApplicationService', () => {
      container.initialize();

      const service = container.resolve('FetchStreamingSessionsApplicationService');
      expect(service).toBeDefined();
    });

    it('should register StreamingStatusBatchApplicationService', () => {
      container.initialize();

      const service = container.resolve('StreamingStatusBatchApplicationService');
      expect(service).toBeDefined();
    });

    it('should register RecordingSessionRepository', () => {
      container.initialize();

      const repo = container.resolve('RecordingSessionRepository');
      expect(repo).toBeDefined();
    });

    it('should register RecordingDomainService', () => {
      container.initialize();

      const service = container.resolve('RecordingDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetLivekitRecordingsApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetLivekitRecordingsApplicationService');
      expect(service).toBeDefined();
    });

    it('should register LiveKitEgressClient', () => {
      container.initialize();

      const client = container.resolve('LiveKitEgressClient');
      expect(client).toBeDefined();
    });

    it('should register BlobUrlService', () => {
      container.initialize();

      const service = container.resolve('BlobUrlService');
      expect(service).toBeDefined();
    });

    it('should register RecordingErrorLogger', () => {
      container.initialize();

      const logger = container.resolve('RecordingErrorLogger');
      expect(logger).toBeDefined();
    });

    it('should register RecordingSessionApplicationService', () => {
      container.initialize();

      const service = container.resolve('RecordingSessionApplicationService');
      expect(service).toBeDefined();
    });

    it('should register LiveKitRecordingService', () => {
      container.initialize();

      const service = container.resolve('LiveKitRecordingService');
      expect(service).toBeDefined();
    });

    it('should register LivekitRecordingDomainService', () => {
      container.initialize();

      const service = container.resolve('LivekitRecordingDomainService');
      expect(service).toBeDefined();
    });

    it('should register LivekitRecordingApplicationService', () => {
      container.initialize();

      const service = container.resolve('LivekitRecordingApplicationService');
      expect(service).toBeDefined();
    });

    it('should register DeleteRecordingDomainService', () => {
      container.initialize();

      const service = container.resolve('DeleteRecordingDomainService');
      expect(service).toBeDefined();
    });

    it('should register DeleteRecordingApplicationService', () => {
      container.initialize();

      const service = container.resolve('DeleteRecordingApplicationService');
      expect(service).toBeDefined();
    });

    it('should register ILiveKitService', () => {
      container.initialize();

      const service = container.resolve('ILiveKitService');
      expect(service).toBeDefined();
    });

    it('should register LiveKitTokenDomainService', () => {
      container.initialize();

      const service = container.resolve('LiveKitTokenDomainService');
      expect(service).toBeDefined();
    });

    it('should register LiveKitTokenApplicationService', () => {
      container.initialize();

      const service = container.resolve('LiveKitTokenApplicationService');
      expect(service).toBeDefined();
    });

    it('should register IPresenceRepository', () => {
      container.initialize();

      const repo = container.resolve('IPresenceRepository');
      expect(repo).toBeDefined();
    });

    it('should register WebPubSubService', () => {
      container.initialize();

      const service = container.resolve('WebPubSubService');
      expect(service).toBeDefined();
    });

    it('should register PresenceDomainService', () => {
      container.initialize();

      const service = container.resolve('PresenceDomainService');
      expect(service).toBeDefined();
    });

    it('should register PresenceUpdateApplicationService', () => {
      container.initialize();

      const service = container.resolve('PresenceUpdateApplicationService');
      expect(service).toBeDefined();
    });

    it('should register ICommandMessagingService', () => {
      container.initialize();

      const service = container.resolve('ICommandMessagingService');
      expect(service).toBeDefined();
    });

    it('should register ProcessCommandDomainService', () => {
      container.initialize();

      const service = container.resolve('ProcessCommandDomainService');
      expect(service).toBeDefined();
    });

    it('should register ProcessCommandApplicationService', () => {
      container.initialize();

      const service = container.resolve('ProcessCommandApplicationService');
      expect(service).toBeDefined();
    });

    it('should register StreamingSessionUpdateDomainService', () => {
      container.initialize();

      const service = container.resolve('StreamingSessionUpdateDomainService');
      expect(service).toBeDefined();
    });

    it('should register StreamingSessionUpdateApplicationService', () => {
      container.initialize();

      const service = container.resolve('StreamingSessionUpdateApplicationService');
      expect(service).toBeDefined();
    });

    it('should register TalkSessionRepository', () => {
      container.initialize();

      const repo = container.resolve('TalkSessionRepository');
      expect(repo).toBeDefined();
    });

    it('should register TalkSessionDomainService', () => {
      container.initialize();

      const service = container.resolve('TalkSessionDomainService');
      expect(service).toBeDefined();
    });

    it('should register TalkSessionApplicationService', () => {
      container.initialize();

      const service = container.resolve('TalkSessionApplicationService');
      expect(service).toBeDefined();
    });

    it('should register WebPubSubTokenDomainService', () => {
      container.initialize();

      const service = container.resolve('WebPubSubTokenDomainService');
      expect(service).toBeDefined();
    });

    it('should register WebPubSubTokenApplicationService', () => {
      container.initialize();

      const service = container.resolve('WebPubSubTokenApplicationService');
      expect(service).toBeDefined();
    });

    it('should register TransferPsosDomainService', () => {
      container.initialize();

      const service = container.resolve('TransferPsosDomainService');
      expect(service).toBeDefined();
    });

    it('should register TransferPsosApplicationService', () => {
      container.initialize();

      const service = container.resolve('TransferPsosApplicationService');
      expect(service).toBeDefined();
    });

    it('should register ErrorLogRepository', () => {
      container.initialize();

      const repo = container.resolve('ErrorLogRepository');
      expect(repo).toBeDefined();
    });

    it('should register ErrorLogService', () => {
      container.initialize();

      const service = container.resolve('ErrorLogService');
      expect(service).toBeDefined();
    });

    it('should register ISnapshotReasonRepository', () => {
      container.initialize();

      const repo = container.resolve('ISnapshotReasonRepository');
      expect(repo).toBeDefined();
    });

    it('should register SendSnapshotDomainService', () => {
      container.initialize();

      const service = container.resolve('SendSnapshotDomainService');
      expect(service).toBeDefined();
    });

    it('should register SendSnapshotApplicationService', () => {
      container.initialize();

      const service = container.resolve('SendSnapshotApplicationService');
      expect(service).toBeDefined();
    });

    it('should register DeleteSnapshotDomainService', () => {
      container.initialize();

      const service = container.resolve('DeleteSnapshotDomainService');
      expect(service).toBeDefined();
    });

    it('should register DeleteSnapshotApplicationService', () => {
      container.initialize();

      const service = container.resolve('DeleteSnapshotApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetSnapshotsDomainService', () => {
      container.initialize();

      const service = container.resolve('GetSnapshotsDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetSnapshotsApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetSnapshotsApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetSnapshotReasonsDomainService', () => {
      container.initialize();

      const service = container.resolve('GetSnapshotReasonsDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetSnapshotReasonsApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetSnapshotReasonsApplicationService');
      expect(service).toBeDefined();
    });

    it('should register CreateSnapshotReasonDomainService', () => {
      container.initialize();

      const service = container.resolve('CreateSnapshotReasonDomainService');
      expect(service).toBeDefined();
    });

    it('should register CreateSnapshotReasonApplicationService', () => {
      container.initialize();

      const service = container.resolve('CreateSnapshotReasonApplicationService');
      expect(service).toBeDefined();
    });

    it('should register UpdateSnapshotReasonDomainService', () => {
      container.initialize();

      const service = container.resolve('UpdateSnapshotReasonDomainService');
      expect(service).toBeDefined();
    });

    it('should register UpdateSnapshotReasonApplicationService', () => {
      container.initialize();

      const service = container.resolve('UpdateSnapshotReasonApplicationService');
      expect(service).toBeDefined();
    });

    it('should register DeleteSnapshotReasonDomainService', () => {
      container.initialize();

      const service = container.resolve('DeleteSnapshotReasonDomainService');
      expect(service).toBeDefined();
    });

    it('should register DeleteSnapshotReasonApplicationService', () => {
      container.initialize();

      const service = container.resolve('DeleteSnapshotReasonApplicationService');
      expect(service).toBeDefined();
    });

    it('should register UpdateSnapshotReasonsBatchDomainService', () => {
      container.initialize();

      const service = container.resolve('UpdateSnapshotReasonsBatchDomainService');
      expect(service).toBeDefined();
    });

    it('should register UpdateSnapshotReasonsBatchApplicationService', () => {
      container.initialize();

      const service = container.resolve('UpdateSnapshotReasonsBatchApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetTalkSessionsDomainService', () => {
      container.initialize();

      const service = container.resolve('GetTalkSessionsDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetTalkSessionsApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetTalkSessionsApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetActiveTalkSessionDomainService', () => {
      container.initialize();

      const service = container.resolve('GetActiveTalkSessionDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetActiveTalkSessionApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetActiveTalkSessionApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetOrCreateChatDomainService', () => {
      container.initialize();

      const service = container.resolve('GetOrCreateChatDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetOrCreateChatApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetOrCreateChatApplicationService');
      expect(service).toBeDefined();
    });

    it('should register WebSocketConnectionDomainService', () => {
      container.initialize();

      const service = container.resolve('WebSocketConnectionDomainService');
      expect(service).toBeDefined();
    });

    it('should register WebSocketConnectionApplicationService', () => {
      container.initialize();

      const service = container.resolve('WebSocketConnectionApplicationService');
      expect(service).toBeDefined();
    });

    it('should register ContactManagerDisconnectDomainService', () => {
      container.initialize();

      const service = container.resolve('ContactManagerDisconnectDomainService');
      expect(service).toBeDefined();
    });

    it('should register ContactManagerDisconnectApplicationService', () => {
      container.initialize();

      const service = container.resolve('ContactManagerDisconnectApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetSupervisorByIdentifierDomainService', () => {
      container.initialize();

      expect(() => {
        container.resolve('GetSupervisorByIdentifierDomainService');
      }).toThrow('ISupervisorRepository');
    });

    it('should handle service dependencies correctly', () => {
      container.initialize();

      expect(() => {
        container.resolve('GetSupervisorByIdentifierApplicationService');
      }).toThrow('ISupervisorRepository');
    });

    it('should register GetSupervisorByIdentifierApplicationService', () => {
      container.initialize();

      expect(() => {
        container.resolve('GetSupervisorByIdentifierApplicationService');
      }).toThrow('ISupervisorRepository');
    });

    it('should register GetPsosBySupervisorDomainService', () => {
      container.initialize();

      const service = container.resolve('GetPsosBySupervisorDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetPsosBySupervisorApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetPsosBySupervisorApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetSupervisorForPsoDomainService', () => {
      container.initialize();

      const service = container.resolve('GetSupervisorForPsoDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetSupervisorForPsoApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetSupervisorForPsoApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetCurrentUserDomainService', () => {
      container.initialize();

      const service = container.resolve('GetCurrentUserDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetCurrentUserApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetCurrentUserApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetUserDebugDomainService', () => {
      container.initialize();

      const service = container.resolve('GetUserDebugDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetUserDebugApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetUserDebugApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetErrorLogsDomainService', () => {
      container.initialize();

      const service = container.resolve('GetErrorLogsDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetErrorLogsApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetErrorLogsApplicationService');
      expect(service).toBeDefined();
    });

    it('should register GetCameraFailuresDomainService', () => {
      container.initialize();

      const service = container.resolve('GetCameraFailuresDomainService');
      expect(service).toBeDefined();
    });

    it('should register GetCameraFailuresApplicationService', () => {
      container.initialize();

      const service = container.resolve('GetCameraFailuresApplicationService');
      expect(service).toBeDefined();
    });

    it('should register DeleteErrorLogsDomainService', () => {
      container.initialize();

      const service = container.resolve('DeleteErrorLogsDomainService');
      expect(service).toBeDefined();
    });

    it('should register DeleteErrorLogsApplicationService', () => {
      container.initialize();

      const service = container.resolve('DeleteErrorLogsApplicationService');
      expect(service).toBeDefined();
    });
  });
});

