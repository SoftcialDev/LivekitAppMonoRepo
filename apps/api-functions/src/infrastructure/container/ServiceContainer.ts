/**
 * @fileoverview ServiceContainer - Dependency injection container
 * @description Manages service dependencies and provides centralized service resolution
 */

// Interfaces
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ICameraFailureService } from '../../domain/interfaces/ICameraFailureService';
import { ICameraStartFailureRepository } from '../../domain/interfaces/ICameraStartFailureRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { ISupervisorRepository } from '../../domain/interfaces/ISupervisorRepository';
import { ISupervisorManagementService } from '../../domain/interfaces/ISupervisorManagementService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { IUserQueryService } from '../../domain/interfaces/IUserQueryService';
import { ICommandAcknowledgmentService } from '../../domain/interfaces/ICommandAcknowledgmentService';
import { IPendingCommandRepository } from '../../domain/interfaces/IPendingCommandRepository';
import { IContactManagerFormService } from '../../domain/interfaces/IContactManagerFormService';
import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';
import { IChatService } from '../../domain/interfaces/IChatService';
import { IContactManagerFormRepository } from '../../domain/interfaces/IContactManagerFormRepository';
import { IStreamingSessionRepository } from '../../domain/interfaces/IStreamingSessionRepository';
import { IRecordingSessionRepository } from '../../domain/interfaces/IRecordingSessionRepository';
import { ILivekitRecordingDomainService } from '../../domain/interfaces/ILivekitRecordingDomainService';
import { ILiveKitEgressClient } from '../../domain/interfaces/ILiveKitEgressClient';
import { IBlobUrlService } from '../../domain/interfaces/IBlobUrlService';
import { IRecordingErrorLogger } from '../../domain/interfaces/IRecordingErrorLogger';
import { ILiveKitService } from '../../domain/interfaces/ILiveKitService';
import { IPresenceRepository } from '../../domain/interfaces/IPresenceRepository';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { ISnapshotRepository } from '../../domain/interfaces/ISnapshotRepository';
import { ISnapshotReasonRepository } from '../../domain/interfaces/ISnapshotReasonRepository';
import { IAuditRepository } from '../../domain/interfaces/IAuditRepository';
import { IErrorLogRepository } from '../../domain/interfaces/IErrorLogRepository';
import { IErrorLogService } from '../../domain/interfaces/IErrorLogService';
import { ITalkSessionRepository } from '../../domain/interfaces/ITalkSessionRepository';
import { IRoleRepository } from '../../domain/interfaces/IRoleRepository';
import { IPermissionRepository } from '../../domain/interfaces/IPermissionRepository';
import { IRolePermissionRepository } from '../../domain/interfaces/IRolePermissionRepository';
import { IUserRoleAssignmentRepository } from '../../domain/interfaces/IUserRoleAssignmentRepository';

// Errors
import { ServiceNotFoundError } from '../../domain/errors/InfrastructureErrors';

// Domain Services
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { SupervisorManagementService } from '../../domain/services/SupervisorManagementService';
import { UserQueryService } from '../../domain/services/UserQueryService';
import { CommandAcknowledgmentService } from '../../domain/services/CommandAcknowledgmentService';
import { ContactManagerFormService } from '../../domain/services/ContactManagerFormService';
import { ContactManagerDomainService } from '../../domain/services/ContactManagerDomainService';
import { SuperAdminDomainService } from '../../domain/services/SuperAdminDomainService';
import { PendingCommandDomainService } from '../../domain/services/PendingCommandDomainService';
import { StreamingSessionDomainService } from '../../domain/services/StreamingSessionDomainService';
import { RecordingDomainService } from '../../domain/services/RecordingDomainService';
import { LivekitRecordingDomainService } from '../../domain/services/LivekitRecordingDomainService';
import { DeleteRecordingDomainService } from '../../domain/services/DeleteRecordingDomainService';
import { LiveKitTokenDomainService } from '../../domain/services/LiveKitTokenDomainService';
import { PresenceDomainService } from '../../domain/services/PresenceDomainService';
import { ProcessCommandDomainService } from '../../domain/services/ProcessCommandDomainService';
import { StreamingSessionUpdateDomainService } from '../../domain/services/StreamingSessionUpdateDomainService';
import { WebPubSubTokenDomainService } from '../../domain/services/WebPubSubTokenDomainService';
import { TransferPsosDomainService } from '../../domain/services/TransferPsosDomainService';
import { SendSnapshotDomainService } from '../../domain/services/SendSnapshotDomainService';
import { DeleteSnapshotDomainService } from '../../domain/services/DeleteSnapshotDomainService';
import { GetSnapshotsDomainService } from '../../domain/services/GetSnapshotsDomainService';
import { GetSnapshotReasonsDomainService } from '../../domain/services/GetSnapshotReasonsDomainService';
import { CreateSnapshotReasonDomainService } from '../../domain/services/CreateSnapshotReasonDomainService';
import { UpdateSnapshotReasonDomainService } from '../../domain/services/UpdateSnapshotReasonDomainService';
import { DeleteSnapshotReasonDomainService } from '../../domain/services/DeleteSnapshotReasonDomainService';
import { UpdateSnapshotReasonsBatchDomainService } from '../../domain/services/UpdateSnapshotReasonsBatchDomainService';
import { GetOrCreateChatDomainService } from '../../domain/services/GetOrCreateChatDomainService';
import { WebSocketConnectionDomainService } from '../../domain/services/WebSocketConnectionDomainService';
import { ContactManagerDisconnectDomainService } from '../../domain/services/ContactManagerDisconnectDomainService';
import { GetSupervisorByIdentifierDomainService } from '../../domain/services/GetSupervisorByIdentifierDomainService';
import { GetPsosBySupervisorDomainService } from '../../domain/services/GetPsosBySupervisorDomainService';
import { GetSupervisorForPsoDomainService } from '../../domain/services/GetSupervisorForPsoDomainService';
import { GetCurrentUserDomainService } from '../../domain/services/GetCurrentUserDomainService';
import { GetUserDebugDomainService } from '../../domain/services/GetUserDebugDomainService';
import { GetErrorLogsDomainService } from '../../domain/services/GetErrorLogsDomainService';
import { GetCameraFailuresDomainService } from '../../domain/services/GetCameraFailuresDomainService';
import { DeleteErrorLogsDomainService } from '../../domain/services/DeleteErrorLogsDomainService';
import { TalkSessionDomainService } from '../../domain/services/TalkSessionDomainService';
import { GetTalkSessionsDomainService } from '../../domain/services/GetTalkSessionsDomainService';
import { GetActiveTalkSessionDomainService } from '../../domain/services/GetActiveTalkSessionDomainService';
import { ErrorLogService } from '../../domain/services/ErrorLogService';

// Application Services
import { CameraFailureApplicationService } from '../../application/services/CameraFailureApplicationService';
import { UserDeletionApplicationService } from '../../application/services/UserDeletionApplicationService';
import { UserQueryApplicationService } from '../../application/services/UserQueryApplicationService';
import { CommandAcknowledgmentApplicationService } from '../../application/services/CommandAcknowledgmentApplicationService';
import { ContactManagerFormApplicationService } from '../../application/services/ContactManagerFormApplicationService';
import { ContactManagerApplicationService } from '../../application/services/ContactManagerApplicationService';
import { SuperAdminApplicationService } from '../../application/services/SuperAdminApplicationService';
import { FetchPendingCommandsApplicationService } from '../../application/services/FetchPendingCommandsApplicationService';
import { FetchStreamingSessionHistoryApplicationService } from '../../application/services/FetchStreamingSessionHistoryApplicationService';
import { FetchStreamingSessionsApplicationService } from '../../application/services/FetchStreamingSessionsApplicationService';
import { StreamingStatusBatchApplicationService } from '../../application/services/StreamingStatusBatchApplicationService';
import { GetLivekitRecordingsApplicationService } from '../../application/services/GetLivekitRecordingsApplicationService';
import { RecordingSessionApplicationService } from '../../application/services/RecordingSessionApplicationService';
import { DeleteRecordingApplicationService } from '../../application/services/DeleteRecordingApplicationService';
import { LiveKitTokenApplicationService } from '../../application/services/LiveKitTokenApplicationService';
import { PresenceUpdateApplicationService } from '../../application/services/PresenceUpdateApplicationService';
import { ProcessCommandApplicationService } from '../../application/services/ProcessCommandApplicationService';
import { LivekitRecordingApplicationService } from '../../application/services/LivekitRecordingApplicationService';
import { StreamingSessionUpdateApplicationService } from '../../application/services/StreamingSessionUpdateApplicationService';
import { WebPubSubTokenApplicationService } from '../../application/services/WebPubSubTokenApplicationService';
import { TransferPsosApplicationService } from '../../application/services/TransferPsosApplicationService';
import { SendSnapshotApplicationService } from '../../application/services/SendSnapshotApplicationService';
import { DeleteSnapshotApplicationService } from '../../application/services/DeleteSnapshotApplicationService';
import { GetSnapshotsApplicationService } from '../../application/services/GetSnapshotsApplicationService';
import { GetSnapshotReasonsApplicationService } from '../../application/services/GetSnapshotReasonsApplicationService';
import { CreateSnapshotReasonApplicationService } from '../../application/services/CreateSnapshotReasonApplicationService';
import { UpdateSnapshotReasonApplicationService } from '../../application/services/UpdateSnapshotReasonApplicationService';
import { DeleteSnapshotReasonApplicationService } from '../../application/services/DeleteSnapshotReasonApplicationService';
import { UpdateSnapshotReasonsBatchApplicationService } from '../../application/services/UpdateSnapshotReasonsBatchApplicationService';
import { GetOrCreateChatApplicationService } from '../../application/services/GetOrCreateChatApplicationService';
import { WebSocketConnectionApplicationService } from '../../application/services/WebSocketConnectionApplicationService';
import { ContactManagerDisconnectApplicationService } from '../../application/services/ContactManagerDisconnectApplicationService';
import { GetSupervisorByIdentifierApplicationService } from '../../application/services/GetSupervisorByIdentifierApplicationService';
import { GetPsosBySupervisorApplicationService } from '../../application/services/GetPsosBySupervisorApplicationService';
import { GetSupervisorForPsoApplicationService } from '../../application/services/GetSupervisorForPsoApplicationService';
import { GetCurrentUserApplicationService } from '../../application/services/GetCurrentUserApplicationService';
import { GetUserDebugApplicationService } from '../../application/services/GetUserDebugApplicationService';
import { GetErrorLogsApplicationService } from '../../application/services/GetErrorLogsApplicationService';
import { GetCameraFailuresApplicationService } from '../../application/services/GetCameraFailuresApplicationService';
import { DeleteErrorLogsApplicationService } from '../../application/services/DeleteErrorLogsApplicationService';
import { TalkSessionApplicationService } from '../../application/services/TalkSessionApplicationService';
import { GetTalkSessionsApplicationService } from '../../application/services/GetTalkSessionsApplicationService';
import { GetActiveTalkSessionApplicationService } from '../../application/services/GetActiveTalkSessionApplicationService';

// Repositories (local)
import { CameraStartFailureRepository } from '../repositories/CameraStartFailureRepository';
import { UserRepository } from '../repositories/UserRepository';
import { SupervisorRepository } from '../repositories/SupervisorRepository';
import { PendingCommandRepository } from '../repositories/PendingCommandRepository';
import { ContactManagerFormRepository } from '../repositories/ContactManagerFormRepository';
import { StreamingSessionRepository } from '../repositories/StreamingSessionRepository';
import { RecordingSessionRepository } from '../repositories/RecordingSessionRepository';
import { SnapshotReasonRepository } from '../repositories/SnapshotReasonRepository';
import { SnapshotRepository } from '../repositories/SnapshotRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { ErrorLogRepository } from '../repositories/ErrorLogRepository';
import { TalkSessionRepository } from '../repositories/TalkSessionRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { PermissionRepository } from '../repositories/PermissionRepository';
import { RolePermissionRepository } from '../repositories/RolePermissionRepository';
import { UserRoleAssignmentRepository } from '../repositories/UserRoleAssignmentRepository';
import { PresenceRepository } from '../repositories/PresenceRepository';

// Infrastructure Services (local)
import { CommandMessagingService } from '../messaging/CommandMessagingService';
import { AuditService } from '../services/AuditService';
import { PresenceService } from '../services/PresenceService';
import { BlobStorageService } from '../services/BlobStorageService';
import { ChatService } from '../services/ChatService';
import { LiveKitRecordingService } from '../services/LiveKitRecordingService';
import { LiveKitEgressClient } from '../services/LiveKitEgressClient';
import { BlobUrlService } from '../services/BlobUrlService';
import { RecordingErrorLoggerService } from '../services/RecordingErrorLoggerService';
import { LiveKitService } from '../services/LiveKitService';
import { WebPubSubService } from '../services/WebPubSubService';

// Config and Prisma
import { config } from '../../config';
import { PrismaClient } from '@prisma/client';
import prisma from '../database/PrismaClientService';

/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  public static initialized: boolean = false;
  private services: Map<string, any> = new Map();

  /**
   * Gets the singleton instance of ServiceContainer
   * @returns ServiceContainer instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Registers a service in the container
   * @param key - Service identifier
   * @param factory - Factory function to create the service
   */
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  /**
   * Resolves a service from the container
   * @param key - Service identifier
   * @returns Service instance
   */
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new ServiceNotFoundError(`Service '${key}' not found in container`);
    }
    return factory();
  }

  /**
   * Initializes all default services
   */
  initialize(): void {
    if (ServiceContainer.initialized) {
      return;
    }

    // Register PrismaClient as singleton
    this.register<PrismaClient>('PrismaClient', () => prisma);

    // Register repositories
    this.register<IUserRepository>('UserRepository', () => new UserRepository() as IUserRepository);
    this.register<ISupervisorRepository>('SupervisorRepository', () => new SupervisorRepository());
    this.register<ISnapshotRepository>('ISnapshotRepository', () => new SnapshotRepository());
    this.register<ICameraStartFailureRepository>('CameraStartFailureRepository', () => new CameraStartFailureRepository());
    this.register<IRoleRepository>('RoleRepository', () => new RoleRepository());
    this.register<IPermissionRepository>('PermissionRepository', () => new PermissionRepository());
    this.register<IRolePermissionRepository>('RolePermissionRepository', () => new RolePermissionRepository());
    this.register<IUserRoleAssignmentRepository>('UserRoleAssignmentRepository', () => new UserRoleAssignmentRepository());

    // Register Audit services
    this.register<IAuditRepository>('IAuditRepository', () => new AuditRepository());
    this.register<IAuditService>('IAuditService', () => {
      const auditRepository = this.resolve<IAuditRepository>('IAuditRepository');
      return new AuditService(auditRepository);
    });

    // Register domain services
    this.register<IAuthorizationService>('AuthorizationService', () => {
      const userRepository = this.resolve<IUserRepository>('UserRepository');
      return new AuthorizationService(userRepository);
    });

    this.register<ICameraFailureService>('CameraFailureService', () => {
      const repo = this.resolve<ICameraStartFailureRepository>('CameraStartFailureRepository');
      return new CameraFailureApplicationService(repo);
    });

    this.register<ISupervisorManagementService>('SupervisorManagementService', () => {
      const userRepository = this.resolve<IUserRepository>('UserRepository');
      const supervisorRepository = this.resolve<ISupervisorRepository>('SupervisorRepository');
      return new SupervisorManagementService(userRepository, supervisorRepository);
    });

          // Register infrastructure services
          this.register<ICommandMessagingService>('CommandMessagingService', () => new CommandMessagingService());
          this.register<IAuditService>('IAuditService', () => {
      const auditRepository = this.resolve<IAuditRepository>('IAuditRepository');
      return new AuditService(auditRepository);
    });
          this.register<IPresenceService>('PresenceService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const presenceDomainService = this.resolve<PresenceDomainService>('PresenceDomainService');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new PresenceService(userRepository, presenceDomainService, webPubSubService);
          });

          // Register application services
          this.register<UserDeletionApplicationService>('UserDeletionApplicationService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const authorizationService = this.resolve<IAuthorizationService>('AuthorizationService');
            const auditService = this.resolve<IAuditService>('IAuditService');
            const presenceService = this.resolve<IPresenceService>('PresenceService');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new UserDeletionApplicationService(
              userRepository,
              authorizationService,
              auditService,
              presenceService,
              webPubSubService
            );
          });

          // Register user query services
          this.register<IUserQueryService>('UserQueryService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new UserQueryService(userRepository);
          });

          this.register<UserQueryApplicationService>('UserQueryApplicationService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const authorizationService = this.resolve<IAuthorizationService>('AuthorizationService');
            const userQueryService = this.resolve<IUserQueryService>('UserQueryService');
            return new UserQueryApplicationService(userRepository, authorizationService, userQueryService);
          });

          // Register pending command repository
          this.register<IPendingCommandRepository>('PendingCommandRepository', () => new PendingCommandRepository());

          // Register command acknowledgment services
          this.register<ICommandAcknowledgmentService>('CommandAcknowledgmentService', () => {
            const pendingCommandRepository = this.resolve<IPendingCommandRepository>('PendingCommandRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new CommandAcknowledgmentService(pendingCommandRepository, userRepository);
          });

          this.register<CommandAcknowledgmentApplicationService>('CommandAcknowledgmentApplicationService', () => {
            const commandAcknowledgmentService = this.resolve<ICommandAcknowledgmentService>('CommandAcknowledgmentService');
            const authorizationService = this.resolve<IAuthorizationService>('AuthorizationService');
            return new CommandAcknowledgmentApplicationService(commandAcknowledgmentService, authorizationService);
          });

          // Register contact manager form services
          this.register<IContactManagerFormRepository>('ContactManagerFormRepository', () => new ContactManagerFormRepository());
          this.register<IBlobStorageService>('BlobStorageService', () => new BlobStorageService());

          this.register<IChatService>('ChatService', () => new ChatService());

          this.register<IContactManagerFormService>('ContactManagerFormService', () => {
            const formRepository = this.resolve<IContactManagerFormRepository>('ContactManagerFormRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            const chatService = this.resolve<IChatService>('ChatService');
            const errorLogService = this.resolve<IErrorLogService>('ErrorLogService');
            return new ContactManagerFormService(formRepository, blobStorageService, chatService, errorLogService);
          });

          this.register<ContactManagerFormApplicationService>('ContactManagerFormApplicationService', () => {
            const contactManagerFormService = this.resolve<IContactManagerFormService>('ContactManagerFormService');
            const authorizationService = this.resolve<IAuthorizationService>('AuthorizationService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new ContactManagerFormApplicationService(contactManagerFormService, authorizationService, userRepository);
          });

          // Register Contact Manager services
          this.register<ContactManagerDomainService>('ContactManagerDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new ContactManagerDomainService(userRepository, webPubSubService);
          });

          this.register<ContactManagerApplicationService>('ContactManagerApplicationService', () => {
            const contactManagerDomainService = this.resolve<ContactManagerDomainService>('ContactManagerDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new ContactManagerApplicationService(contactManagerDomainService, authorizationService);
          });

          // Register Super Admin services
          this.register<SuperAdminDomainService>('SuperAdminDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new SuperAdminDomainService(userRepository);
          });

          this.register<SuperAdminApplicationService>('SuperAdminApplicationService', () => {
            const superAdminDomainService = this.resolve<SuperAdminDomainService>('SuperAdminDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new SuperAdminApplicationService(superAdminDomainService, authorizationService);
          });

          // Register Pending Command services
          this.register<PendingCommandDomainService>('PendingCommandDomainService', () => {
            const pendingCommandRepository = this.resolve<IPendingCommandRepository>('PendingCommandRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new PendingCommandDomainService(pendingCommandRepository, userRepository);
          });

          this.register<FetchPendingCommandsApplicationService>('FetchPendingCommandsApplicationService', () => {
            const pendingCommandDomainService = this.resolve<PendingCommandDomainService>('PendingCommandDomainService');
            return new FetchPendingCommandsApplicationService(pendingCommandDomainService);
          });

          // Register Streaming Session services
          this.register<IStreamingSessionRepository>('StreamingSessionRepository', () => new StreamingSessionRepository());
          
          this.register<StreamingSessionDomainService>('StreamingSessionDomainService', () => {
            const streamingSessionRepository = this.resolve<IStreamingSessionRepository>('StreamingSessionRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new StreamingSessionDomainService(streamingSessionRepository, userRepository);
          });

          this.register<FetchStreamingSessionHistoryApplicationService>('FetchStreamingSessionHistoryApplicationService', () => {
            const streamingSessionDomainService = this.resolve<StreamingSessionDomainService>('StreamingSessionDomainService');
            return new FetchStreamingSessionHistoryApplicationService(streamingSessionDomainService);
          });

          this.register<FetchStreamingSessionsApplicationService>('FetchStreamingSessionsApplicationService', () => {
            const streamingSessionDomainService = this.resolve<StreamingSessionDomainService>('StreamingSessionDomainService');
            return new FetchStreamingSessionsApplicationService(streamingSessionDomainService);
          });

          this.register<StreamingStatusBatchApplicationService>('StreamingStatusBatchApplicationService', () => {
            const streamingSessionRepository = this.resolve<IStreamingSessionRepository>('StreamingSessionRepository');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new StreamingStatusBatchApplicationService(streamingSessionRepository, authorizationService);
          });

          // Register Recording Session services
          this.register<IRecordingSessionRepository>('RecordingSessionRepository', () => new RecordingSessionRepository());
          
          this.register<RecordingDomainService>('RecordingDomainService', () => {
            const recordingRepository = this.resolve<IRecordingSessionRepository>('RecordingSessionRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new RecordingDomainService(recordingRepository, userRepository);
          });

          this.register<GetLivekitRecordingsApplicationService>('GetLivekitRecordingsApplicationService', () => {
            const recordingDomainService = this.resolve<RecordingDomainService>('RecordingDomainService');
            return new GetLivekitRecordingsApplicationService(recordingDomainService);
          });

          // Register LiveKit Recording services
          this.register<ILiveKitEgressClient>('LiveKitEgressClient', () => {
            return new LiveKitEgressClient();
          });

          this.register<IBlobUrlService>('BlobUrlService', () => {
            return new BlobUrlService();
          });

          this.register<IRecordingErrorLogger>('RecordingErrorLogger', () => {
            const errorLogService = this.resolve<IErrorLogService>('ErrorLogService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new RecordingErrorLoggerService(errorLogService, userRepository);
          });

          this.register<RecordingSessionApplicationService>('RecordingSessionApplicationService', () => {
            const egressClient = this.resolve<ILiveKitEgressClient>('LiveKitEgressClient');
            const recordingRepository = this.resolve<IRecordingSessionRepository>('RecordingSessionRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            const blobUrlService = this.resolve<IBlobUrlService>('BlobUrlService');
            const errorLogger = this.resolve<IRecordingErrorLogger>('RecordingErrorLogger');
            return new RecordingSessionApplicationService(
              egressClient,
              recordingRepository,
              blobStorageService,
              blobUrlService,
              errorLogger
            );
          });

          this.register<LiveKitRecordingService>('LiveKitRecordingService', () => {
            const recordingRepository = this.resolve<IRecordingSessionRepository>('RecordingSessionRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            const errorLogService = this.resolve<IErrorLogService>('ErrorLogService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new LiveKitRecordingService(recordingRepository, blobStorageService, errorLogService, userRepository);
          });

          this.register<ILivekitRecordingDomainService>('LivekitRecordingDomainService', () => {
            const applicationService = this.resolve<RecordingSessionApplicationService>('RecordingSessionApplicationService');
            return new LivekitRecordingDomainService(applicationService);
          });

          this.register<LivekitRecordingApplicationService>('LivekitRecordingApplicationService', () => {
            const recordingDomainService = this.resolve<ILivekitRecordingDomainService>('LivekitRecordingDomainService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new LivekitRecordingApplicationService(recordingDomainService, userRepository, authorizationService);
          });

          // Register Delete Recording services
          this.register<DeleteRecordingDomainService>('DeleteRecordingDomainService', () => {
            const recordingRepository = this.resolve<IRecordingSessionRepository>('RecordingSessionRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            return new DeleteRecordingDomainService(recordingRepository, blobStorageService);
          });

          this.register<DeleteRecordingApplicationService>('DeleteRecordingApplicationService', () => {
            const deleteRecordingDomainService = this.resolve<DeleteRecordingDomainService>('DeleteRecordingDomainService');
            return new DeleteRecordingApplicationService(deleteRecordingDomainService);
          });

          // Register Config service

          // Register LiveKit services
          this.register<ILiveKitService>('ILiveKitService', () => new LiveKitService());

          this.register<LiveKitTokenDomainService>('LiveKitTokenDomainService', () => {
            const liveKitService = this.resolve<ILiveKitService>('ILiveKitService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new LiveKitTokenDomainService(liveKitService, userRepository);
          });

          this.register<LiveKitTokenApplicationService>('LiveKitTokenApplicationService', () => {
            const liveKitTokenDomainService = this.resolve<LiveKitTokenDomainService>('LiveKitTokenDomainService');
            return new LiveKitTokenApplicationService(liveKitTokenDomainService);
          });

          // Register Presence services
          this.register<IPresenceRepository>('IPresenceRepository', () => {
            const prisma = this.resolve<PrismaClient>('PrismaClient');
            return new PresenceRepository(prisma);
          });

          this.register<IWebPubSubService>('WebPubSubService', () => new WebPubSubService());

          this.register<PresenceDomainService>('PresenceDomainService', () => {
            const presenceRepository = this.resolve<IPresenceRepository>('IPresenceRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new PresenceDomainService(presenceRepository, userRepository, webPubSubService);
          });

          this.register<PresenceUpdateApplicationService>('PresenceUpdateApplicationService', () => {
            const presenceDomainService = this.resolve<PresenceDomainService>('PresenceDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new PresenceUpdateApplicationService(presenceDomainService, authorizationService);
          });

          // Register Process Command services
          this.register<ICommandMessagingService>('ICommandMessagingService', () => new CommandMessagingService());

          this.register<ProcessCommandDomainService>('ProcessCommandDomainService', () => {
            const pendingCommandDomainService = this.resolve<PendingCommandDomainService>('PendingCommandDomainService');
            const streamingSessionDomainService = this.resolve<StreamingSessionDomainService>('StreamingSessionDomainService');
            const presenceDomainService = this.resolve<PresenceDomainService>('PresenceDomainService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const commandMessagingService = this.resolve<ICommandMessagingService>('ICommandMessagingService');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new ProcessCommandDomainService(pendingCommandDomainService, streamingSessionDomainService, presenceDomainService, userRepository, commandMessagingService, webPubSubService);
          });

          this.register<ProcessCommandApplicationService>('ProcessCommandApplicationService', () => {
            const processCommandDomainService = this.resolve<ProcessCommandDomainService>('ProcessCommandDomainService');
            return new ProcessCommandApplicationService(processCommandDomainService);
          });

          // Register Streaming Session Update services
          this.register<StreamingSessionUpdateDomainService>('StreamingSessionUpdateDomainService', () => {
            const streamingSessionDomainService = this.resolve<StreamingSessionDomainService>('StreamingSessionDomainService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new StreamingSessionUpdateDomainService(streamingSessionDomainService, userRepository, webPubSubService);
          });

          this.register<StreamingSessionUpdateApplicationService>('StreamingSessionUpdateApplicationService', () => {
            const streamingSessionUpdateDomainService = this.resolve<StreamingSessionUpdateDomainService>('StreamingSessionUpdateDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new StreamingSessionUpdateApplicationService(streamingSessionUpdateDomainService, authorizationService);
          });

          // Register Talk Session services
          this.register<ITalkSessionRepository>('TalkSessionRepository', () => new TalkSessionRepository());
          
          this.register<TalkSessionDomainService>('TalkSessionDomainService', () => {
            const talkSessionRepository = this.resolve<ITalkSessionRepository>('TalkSessionRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new TalkSessionDomainService(talkSessionRepository, userRepository, webPubSubService);
          });

          this.register<TalkSessionApplicationService>('TalkSessionApplicationService', () => {
            const talkSessionDomainService = this.resolve<TalkSessionDomainService>('TalkSessionDomainService');
            return new TalkSessionApplicationService(talkSessionDomainService);
          });

          // Register WebPubSub services
          this.register<IWebPubSubService>('WebPubSubService', () => new WebPubSubService());

          this.register<WebPubSubTokenDomainService>('WebPubSubTokenDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new WebPubSubTokenDomainService(userRepository, webPubSubService);
          });

          this.register<WebPubSubTokenApplicationService>('WebPubSubTokenApplicationService', () => {
            const webPubSubTokenDomainService = this.resolve<WebPubSubTokenDomainService>('WebPubSubTokenDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new WebPubSubTokenApplicationService(webPubSubTokenDomainService, authorizationService);
          });

          // Register Transfer PSOs services
          this.register<TransferPsosDomainService>('TransferPsosDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const commandMessagingService = this.resolve<ICommandMessagingService>('ICommandMessagingService');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new TransferPsosDomainService(userRepository, commandMessagingService, webPubSubService);
          });

          this.register<TransferPsosApplicationService>('TransferPsosApplicationService', () => {
            const transferPsosDomainService = this.resolve<TransferPsosDomainService>('TransferPsosDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new TransferPsosApplicationService(transferPsosDomainService, authorizationService);
          });

          // Register Error Log services
          this.register<IErrorLogRepository>('ErrorLogRepository', () => new ErrorLogRepository());
          this.register<IErrorLogService>('ErrorLogService', () => {
            const errorLogRepository = this.resolve<IErrorLogRepository>('ErrorLogRepository');
            return new ErrorLogService(errorLogRepository);
          });

          // Register Send Snapshot services
          this.register<ISnapshotReasonRepository>('ISnapshotReasonRepository', () => {
            return new SnapshotReasonRepository();
          });

          this.register<SendSnapshotDomainService>('SendSnapshotDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            const snapshotRepository = this.resolve<ISnapshotRepository>('ISnapshotRepository');
            const snapshotReasonRepository = this.resolve<ISnapshotReasonRepository>('ISnapshotReasonRepository');
            const chatService = this.resolve<IChatService>('ChatService');
            const errorLogService = this.resolve<IErrorLogService>('ErrorLogService');
            return new SendSnapshotDomainService(
              userRepository,
              blobStorageService,
              snapshotRepository,
              snapshotReasonRepository,
              chatService,
              errorLogService
            );
          });

          this.register<SendSnapshotApplicationService>('SendSnapshotApplicationService', () => {
            const sendSnapshotDomainService = this.resolve<SendSnapshotDomainService>('SendSnapshotDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new SendSnapshotApplicationService(sendSnapshotDomainService, authorizationService);
          });

          // Register Delete Snapshot services
          this.register<DeleteSnapshotDomainService>('DeleteSnapshotDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            const snapshotRepository = this.resolve<ISnapshotRepository>('ISnapshotRepository');
            return new DeleteSnapshotDomainService(userRepository, blobStorageService, snapshotRepository);
          });

          this.register<DeleteSnapshotApplicationService>('DeleteSnapshotApplicationService', () => {
            const deleteSnapshotDomainService = this.resolve<DeleteSnapshotDomainService>('DeleteSnapshotDomainService');
            return new DeleteSnapshotApplicationService(deleteSnapshotDomainService);
          });

          // Register Get Snapshots services
          this.register<GetSnapshotsDomainService>('GetSnapshotsDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const snapshotRepository = this.resolve<ISnapshotRepository>('ISnapshotRepository');
            return new GetSnapshotsDomainService(userRepository, snapshotRepository);
          });

          this.register<GetSnapshotsApplicationService>('GetSnapshotsApplicationService', () => {
            const getSnapshotsDomainService = this.resolve<GetSnapshotsDomainService>('GetSnapshotsDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new GetSnapshotsApplicationService(getSnapshotsDomainService, authorizationService);
          });

          // Register Snapshot Reason services
          this.register<GetSnapshotReasonsDomainService>('GetSnapshotReasonsDomainService', () => {
            const snapshotReasonRepository = this.resolve<ISnapshotReasonRepository>('ISnapshotReasonRepository');
            return new GetSnapshotReasonsDomainService(snapshotReasonRepository);
          });

          this.register<GetSnapshotReasonsApplicationService>('GetSnapshotReasonsApplicationService', () => {
            const getSnapshotReasonsDomainService = this.resolve<GetSnapshotReasonsDomainService>('GetSnapshotReasonsDomainService');
            return new GetSnapshotReasonsApplicationService(getSnapshotReasonsDomainService);
          });

          this.register<CreateSnapshotReasonDomainService>('CreateSnapshotReasonDomainService', () => {
            const snapshotReasonRepository = this.resolve<ISnapshotReasonRepository>('ISnapshotReasonRepository');
            return new CreateSnapshotReasonDomainService(snapshotReasonRepository);
          });

          this.register<CreateSnapshotReasonApplicationService>('CreateSnapshotReasonApplicationService', () => {
            const createSnapshotReasonDomainService = this.resolve<CreateSnapshotReasonDomainService>('CreateSnapshotReasonDomainService');
            return new CreateSnapshotReasonApplicationService(createSnapshotReasonDomainService);
          });

          this.register<UpdateSnapshotReasonDomainService>('UpdateSnapshotReasonDomainService', () => {
            const snapshotReasonRepository = this.resolve<ISnapshotReasonRepository>('ISnapshotReasonRepository');
            return new UpdateSnapshotReasonDomainService(snapshotReasonRepository);
          });

          this.register<UpdateSnapshotReasonApplicationService>('UpdateSnapshotReasonApplicationService', () => {
            const updateSnapshotReasonDomainService = this.resolve<UpdateSnapshotReasonDomainService>('UpdateSnapshotReasonDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new UpdateSnapshotReasonApplicationService(updateSnapshotReasonDomainService, authorizationService);
          });

          this.register<DeleteSnapshotReasonDomainService>('DeleteSnapshotReasonDomainService', () => {
            const snapshotReasonRepository = this.resolve<ISnapshotReasonRepository>('ISnapshotReasonRepository');
            return new DeleteSnapshotReasonDomainService(snapshotReasonRepository);
          });

          this.register<DeleteSnapshotReasonApplicationService>('DeleteSnapshotReasonApplicationService', () => {
            const deleteSnapshotReasonDomainService = this.resolve<DeleteSnapshotReasonDomainService>('DeleteSnapshotReasonDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new DeleteSnapshotReasonApplicationService(deleteSnapshotReasonDomainService, authorizationService);
          });

          this.register<UpdateSnapshotReasonsBatchDomainService>('UpdateSnapshotReasonsBatchDomainService', () => {
            const snapshotReasonRepository = this.resolve<ISnapshotReasonRepository>('ISnapshotReasonRepository');
            return new UpdateSnapshotReasonsBatchDomainService(snapshotReasonRepository);
          });

          this.register<UpdateSnapshotReasonsBatchApplicationService>('UpdateSnapshotReasonsBatchApplicationService', () => {
            const updateSnapshotReasonsBatchDomainService = this.resolve<UpdateSnapshotReasonsBatchDomainService>('UpdateSnapshotReasonsBatchDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new UpdateSnapshotReasonsBatchApplicationService(updateSnapshotReasonsBatchDomainService, authorizationService);
          });

          this.register<GetTalkSessionsDomainService>('GetTalkSessionsDomainService', () => {
            const talkSessionRepository = this.resolve<ITalkSessionRepository>('TalkSessionRepository');
            return new GetTalkSessionsDomainService(talkSessionRepository);
          });

          this.register<GetTalkSessionsApplicationService>('GetTalkSessionsApplicationService', () => {
            const getTalkSessionsDomainService = this.resolve<GetTalkSessionsDomainService>('GetTalkSessionsDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new GetTalkSessionsApplicationService(getTalkSessionsDomainService, authorizationService, userRepository);
          });

          // Register GetActiveTalkSession services
          this.register<GetActiveTalkSessionDomainService>('GetActiveTalkSessionDomainService', () => {
            const talkSessionRepository = this.resolve<ITalkSessionRepository>('TalkSessionRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new GetActiveTalkSessionDomainService(talkSessionRepository, userRepository);
          });

          this.register<GetActiveTalkSessionApplicationService>('GetActiveTalkSessionApplicationService', () => {
            const getActiveTalkSessionDomainService = this.resolve<GetActiveTalkSessionDomainService>('GetActiveTalkSessionDomainService');
            return new GetActiveTalkSessionApplicationService(getActiveTalkSessionDomainService);
          });

          // Register Get Or Create Chat services
          this.register<GetOrCreateChatDomainService>('GetOrCreateChatDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const chatService = this.resolve<IChatService>('ChatService');
            return new GetOrCreateChatDomainService(userRepository, chatService);
          });

          this.register<GetOrCreateChatApplicationService>('GetOrCreateChatApplicationService', () => {
            const getOrCreateChatDomainService = this.resolve<GetOrCreateChatDomainService>('GetOrCreateChatDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new GetOrCreateChatApplicationService(getOrCreateChatDomainService, authorizationService);
          });

          // Register WebSocket Connection services
          this.register<WebSocketConnectionDomainService>('WebSocketConnectionDomainService', () => {
            const presenceDomainService = this.resolve<PresenceDomainService>('PresenceDomainService');
            const streamingSessionDomainService = this.resolve<StreamingSessionDomainService>('StreamingSessionDomainService');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const liveKitRecordingService = this.resolve<LiveKitRecordingService>('LiveKitRecordingService');
            const talkSessionRepository = this.resolve<ITalkSessionRepository>('TalkSessionRepository');
            const talkSessionDomainService = this.resolve<TalkSessionDomainService>('TalkSessionDomainService');
            return new WebSocketConnectionDomainService(
              presenceDomainService,
              streamingSessionDomainService,
              webPubSubService,
              userRepository,
              liveKitRecordingService,
              talkSessionRepository,
              talkSessionDomainService
            );
          });

          this.register<WebSocketConnectionApplicationService>('WebSocketConnectionApplicationService', () => {
            const webSocketConnectionDomainService = this.resolve<WebSocketConnectionDomainService>('WebSocketConnectionDomainService');
            return new WebSocketConnectionApplicationService(webSocketConnectionDomainService);
          });

          // Register Contact Manager Disconnect services
          this.register<ContactManagerDisconnectDomainService>('ContactManagerDisconnectDomainService', () => {
            const commandMessagingService = this.resolve<ICommandMessagingService>('ICommandMessagingService');
            return new ContactManagerDisconnectDomainService(commandMessagingService);
          });

          this.register<ContactManagerDisconnectApplicationService>('ContactManagerDisconnectApplicationService', () => {
            const contactManagerDisconnectDomainService = this.resolve<ContactManagerDisconnectDomainService>('ContactManagerDisconnectDomainService');
            const presenceDomainService = this.resolve<PresenceDomainService>('PresenceDomainService');
            const webPubSubService = this.resolve<IWebPubSubService>('WebPubSubService');
            return new ContactManagerDisconnectApplicationService(contactManagerDisconnectDomainService, presenceDomainService, webPubSubService);
          });

          // Register Get Supervisor By Identifier services
          this.register<GetSupervisorByIdentifierDomainService>('GetSupervisorByIdentifierDomainService', () => {
            const supervisorRepository = this.resolve<ISupervisorRepository>('ISupervisorRepository');
            return new GetSupervisorByIdentifierDomainService(supervisorRepository);
          });

          this.register<GetSupervisorByIdentifierApplicationService>('GetSupervisorByIdentifierApplicationService', () => {
            const getSupervisorByIdentifierDomainService = this.resolve<GetSupervisorByIdentifierDomainService>('GetSupervisorByIdentifierDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new GetSupervisorByIdentifierApplicationService(getSupervisorByIdentifierDomainService, authorizationService);
          });

          // Register Get PSOs By Supervisor services
          this.register<GetPsosBySupervisorDomainService>('GetPsosBySupervisorDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new GetPsosBySupervisorDomainService(userRepository);
          });

          this.register<GetPsosBySupervisorApplicationService>('GetPsosBySupervisorApplicationService', () => {
            const getPsosBySupervisorDomainService = this.resolve<GetPsosBySupervisorDomainService>('GetPsosBySupervisorDomainService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new GetPsosBySupervisorApplicationService(getPsosBySupervisorDomainService, userRepository);
          });

          // Register Get Supervisor For PSO services
          this.register<GetSupervisorForPsoDomainService>('GetSupervisorForPsoDomainService', () => {
            const supervisorRepository = this.resolve<ISupervisorRepository>('SupervisorRepository');
            return new GetSupervisorForPsoDomainService(supervisorRepository);
          });

          this.register<GetSupervisorForPsoApplicationService>('GetSupervisorForPsoApplicationService', () => {
            const getSupervisorForPsoDomainService = this.resolve<GetSupervisorForPsoDomainService>('GetSupervisorForPsoDomainService');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new GetSupervisorForPsoApplicationService(getSupervisorForPsoDomainService, userRepository);
          });

          // Register Get Current User services
          this.register<GetCurrentUserDomainService>('GetCurrentUserDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            return new GetCurrentUserDomainService(userRepository);
          });

          this.register<GetCurrentUserApplicationService>('GetCurrentUserApplicationService', () => {
            const getCurrentUserDomainService = this.resolve<GetCurrentUserDomainService>('GetCurrentUserDomainService');
            return new GetCurrentUserApplicationService(getCurrentUserDomainService);
          });

          // Register Get User Debug services
          this.register<GetUserDebugDomainService>('GetUserDebugDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const userRoleAssignmentRepository = this.resolve<IUserRoleAssignmentRepository>('UserRoleAssignmentRepository');
            const permissionRepository = this.resolve<IPermissionRepository>('PermissionRepository');
            return new GetUserDebugDomainService(
              userRepository,
              userRoleAssignmentRepository,
              permissionRepository
            );
          });

          this.register<GetUserDebugApplicationService>('GetUserDebugApplicationService', () => {
            const getUserDebugDomainService = this.resolve<GetUserDebugDomainService>('GetUserDebugDomainService');
            return new GetUserDebugApplicationService(getUserDebugDomainService);
          });

          // Register Get Error Logs services
          this.register<GetErrorLogsDomainService>('GetErrorLogsDomainService', () => {
            const errorLogRepository = this.resolve<IErrorLogRepository>('ErrorLogRepository');
            return new GetErrorLogsDomainService(errorLogRepository);
          });

          this.register<GetErrorLogsApplicationService>('GetErrorLogsApplicationService', () => {
            const getErrorLogsDomainService = this.resolve<GetErrorLogsDomainService>('GetErrorLogsDomainService');
            return new GetErrorLogsApplicationService(getErrorLogsDomainService);
          });

          this.register<GetCameraFailuresDomainService>('GetCameraFailuresDomainService', () => {
            const cameraFailureRepository = this.resolve<ICameraStartFailureRepository>('CameraStartFailureRepository');
            return new GetCameraFailuresDomainService(cameraFailureRepository);
          });

          this.register<GetCameraFailuresApplicationService>('GetCameraFailuresApplicationService', () => {
            const getCameraFailuresDomainService = this.resolve<GetCameraFailuresDomainService>('GetCameraFailuresDomainService');
            return new GetCameraFailuresApplicationService(getCameraFailuresDomainService);
          });

          // Register Delete Error Logs services
          this.register<DeleteErrorLogsDomainService>('DeleteErrorLogsDomainService', () => {
            const errorLogRepository = this.resolve<IErrorLogRepository>('ErrorLogRepository');
            return new DeleteErrorLogsDomainService(errorLogRepository);
          });

          this.register<DeleteErrorLogsApplicationService>('DeleteErrorLogsApplicationService', () => {
            const deleteErrorLogsDomainService = this.resolve<DeleteErrorLogsDomainService>('DeleteErrorLogsDomainService');
            return new DeleteErrorLogsApplicationService(deleteErrorLogsDomainService);
          });
    
    ServiceContainer.initialized = true;
  }
}

/**
 * Global service container instance
 */
export const serviceContainer = ServiceContainer.getInstance();
