/**
 * @fileoverview ServiceContainer - Dependency injection container
 * @description Manages service dependencies and provides centralized service resolution
 */

import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { ISupervisorRepository } from '../../domain/interfaces/ISupervisorRepository';
import { ISupervisorManagementService } from '../../domain/interfaces/ISupervisorManagementService';
import { IGraphService } from '../../domain/interfaces/IGraphService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { UserRepository } from '../repositories/UserRepository';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { CommandMessagingService } from '../messaging/CommandMessagingService';
import { SupervisorRepository } from '../repositories/SupervisorRepository';
import { SupervisorManagementService } from '../../domain/services/SupervisorManagementService';
import { GraphService } from '../services/GraphService';
import { AuditService } from '../services/AuditService';
import { PresenceService } from '../services/PresenceService';
import { UserDeletionApplicationService } from '../../application/services/UserDeletionApplicationService';
import { UserQueryApplicationService } from '../../application/services/UserQueryApplicationService';
import { IUserQueryService } from '../../domain/services/UserQueryService';
import { UserQueryService } from '../../domain/services/UserQueryService';
import { ICommandAcknowledgmentService } from '../../domain/interfaces/ICommandAcknowledgmentService';
import { IPendingCommandRepository } from '../../domain/interfaces/IPendingCommandRepository';
import { CommandAcknowledgmentService } from '../../domain/services/CommandAcknowledgmentService';
import { PendingCommandRepository } from '../repositories/PendingCommandRepository';
import { CommandAcknowledgmentApplicationService } from '../../application/services/CommandAcknowledgmentApplicationService';
import { IContactManagerFormService } from '../../domain/interfaces/IContactManagerFormService';
import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';
import { IChatService } from '../../domain/interfaces/IChatService';
import { IContactManagerFormRepository } from '../../domain/interfaces/IContactManagerFormRepository';
import { ContactManagerFormService } from '../../domain/services/ContactManagerFormService';
import { BlobStorageService } from '../services/BlobStorageService';
import { ChatService } from '../services/ChatService';
import { ContactManagerFormRepository } from '../repositories/ContactManagerFormRepository';
import { ContactManagerFormApplicationService } from '../../application/services/ContactManagerFormApplicationService';
import { ContactManagerDomainService } from '../../domain/services/ContactManagerDomainService';
import { ContactManagerApplicationService } from '../../application/services/ContactManagerApplicationService';
import { SuperAdminDomainService } from '../../domain/services/SuperAdminDomainService';
import { SuperAdminApplicationService } from '../../application/services/SuperAdminApplicationService';
import { PendingCommandDomainService } from '../../domain/services/PendingCommandDomainService';
import { FetchPendingCommandsApplicationService } from '../../application/services/FetchPendingCommandsApplicationService';
import { IStreamingSessionRepository } from '../../domain/interfaces/IStreamingSessionRepository';
import { StreamingSessionRepository } from '../repositories/StreamingSessionRepository';
import { StreamingSessionDomainService } from '../../domain/services/StreamingSessionDomainService';
import { FetchStreamingSessionHistoryApplicationService } from '../../application/services/FetchStreamingSessionHistoryApplicationService';
import { FetchStreamingSessionsApplicationService } from '../../application/services/FetchStreamingSessionsApplicationService';
import { StreamingStatusBatchApplicationService } from '../../application/services/StreamingStatusBatchApplicationService';
import { IRecordingSessionRepository } from '../../domain/interfaces/IRecordingSessionRepository';
import { RecordingSessionRepository } from '../repositories/RecordingSessionRepository';
import { RecordingDomainService } from '../../domain/services/RecordingDomainService';
import { GetLivekitRecordingsApplicationService } from '../../application/services/GetLivekitRecordingsApplicationService';
import { ILivekitRecordingDomainService } from '../../domain/interfaces/ILivekitRecordingDomainService';
import { LivekitRecordingDomainService } from '../../domain/services/LivekitRecordingDomainService';
import { DeleteRecordingApplicationService } from '../../application/services/DeleteRecordingApplicationService';
import { DeleteRecordingDomainService } from '../../domain/services/DeleteRecordingDomainService';
import { LiveKitTokenApplicationService } from '../../application/services/LiveKitTokenApplicationService';
import { LiveKitTokenDomainService } from '../../domain/services/LiveKitTokenDomainService';
import { ILiveKitService } from '../../domain/interfaces/ILiveKitService';
import { LiveKitService } from '../services/LiveKitService';
import { IPresenceRepository } from '../../domain/interfaces/IPresenceRepository';
import { PresenceRepository } from '../repositories/PresenceRepository';
import { PresenceDomainService } from '../../domain/services/PresenceDomainService';
import { PresenceUpdateApplicationService } from '../../application/services/PresenceUpdateApplicationService';
import { PrismaClient } from '@prisma/client';
import prisma from '../database/PrismaClientService';
import { ProcessCommandDomainService } from '../../domain/services/ProcessCommandDomainService';
import { ProcessCommandApplicationService } from '../../application/services/ProcessCommandApplicationService';
import { LivekitRecordingApplicationService } from '../../application/services/LivekitRecordingApplicationService';
import { StreamingSessionUpdateDomainService } from '../../domain/services/StreamingSessionUpdateDomainService';
import { StreamingSessionUpdateApplicationService } from '../../application/services/StreamingSessionUpdateApplicationService';
import { WebPubSubTokenDomainService } from '../../domain/services/WebPubSubTokenDomainService';
import { WebPubSubTokenApplicationService } from '../../application/services/WebPubSubTokenApplicationService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { WebPubSubService } from '../services/WebPubSubService';
import { TransferPsosDomainService } from '../../domain/services/TransferPsosDomainService';
import { TransferPsosApplicationService } from '../../application/services/TransferPsosApplicationService';
import { SendSnapshotDomainService } from '../../domain/services/SendSnapshotDomainService';
import { SendSnapshotApplicationService } from '../../application/services/SendSnapshotApplicationService';
import { DeleteSnapshotDomainService } from '../../domain/services/DeleteSnapshotDomainService';
import { DeleteSnapshotApplicationService } from '../../application/services/DeleteSnapshotApplicationService';
import { GetSnapshotsDomainService } from '../../domain/services/GetSnapshotsDomainService';
import { GetSnapshotsApplicationService } from '../../application/services/GetSnapshotsApplicationService';
import { GetOrCreateChatDomainService } from '../../domain/services/GetOrCreateChatDomainService';
import { GetOrCreateChatApplicationService } from '../../application/services/GetOrCreateChatApplicationService';
import { WebSocketConnectionDomainService } from '../../domain/services/WebSocketConnectionDomainService';
import { WebSocketConnectionApplicationService } from '../../application/services/WebSocketConnectionApplicationService';
import { ContactManagerDisconnectDomainService } from '../../domain/services/ContactManagerDisconnectDomainService';
import { ContactManagerDisconnectApplicationService } from '../../application/services/ContactManagerDisconnectApplicationService';
import { GetSupervisorByIdentifierDomainService } from '../../domain/services/GetSupervisorByIdentifierDomainService';
import { GetSupervisorByIdentifierApplicationService } from '../../application/services/GetSupervisorByIdentifierApplicationService';
import { GetPsosBySupervisorDomainService } from '../../domain/services/GetPsosBySupervisorDomainService';
import { GetPsosBySupervisorApplicationService } from '../../application/services/GetPsosBySupervisorApplicationService';
import { GetSupervisorForPsoDomainService } from '../../domain/services/GetSupervisorForPsoDomainService';
import { GetSupervisorForPsoApplicationService } from '../../application/services/GetSupervisorForPsoApplicationService';
import { ISnapshotRepository } from '../../domain/interfaces/ISnapshotRepository';
import { SnapshotRepository } from '../repositories/SnapshotRepository';
import { IAuditRepository } from '../../domain/interfaces/IAuditRepository';
import { AuditRepository } from '../repositories/AuditRepository';

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
      throw new Error(`Service '${key}' not found in container`);
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
            return new UserDeletionApplicationService(
              userRepository,
              authorizationService,
              auditService,
              presenceService
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
            return new ContactManagerFormService(formRepository, blobStorageService, chatService);
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
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new FetchPendingCommandsApplicationService(pendingCommandDomainService, authorizationService);
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
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new FetchStreamingSessionHistoryApplicationService(streamingSessionDomainService, authorizationService);
          });

          this.register<FetchStreamingSessionsApplicationService>('FetchStreamingSessionsApplicationService', () => {
            const streamingSessionDomainService = this.resolve<StreamingSessionDomainService>('StreamingSessionDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new FetchStreamingSessionsApplicationService(streamingSessionDomainService, authorizationService);
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
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new GetLivekitRecordingsApplicationService(recordingDomainService, authorizationService);
          });

          // Register LiveKit Recording services
          this.register<ILivekitRecordingDomainService>('LivekitRecordingDomainService', () => {
            const recordingRepository = this.resolve<IRecordingSessionRepository>('RecordingSessionRepository');
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            return new LivekitRecordingDomainService(recordingRepository, userRepository, blobStorageService);
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
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new DeleteRecordingApplicationService(deleteRecordingDomainService, authorizationService);
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
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new LiveKitTokenApplicationService(liveKitTokenDomainService, authorizationService);
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
            return new StreamingSessionUpdateDomainService(streamingSessionDomainService, userRepository);
          });

          this.register<StreamingSessionUpdateApplicationService>('StreamingSessionUpdateApplicationService', () => {
            const streamingSessionUpdateDomainService = this.resolve<StreamingSessionUpdateDomainService>('StreamingSessionUpdateDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new StreamingSessionUpdateApplicationService(streamingSessionUpdateDomainService, authorizationService);
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
            return new TransferPsosDomainService(userRepository, commandMessagingService);
          });

          this.register<TransferPsosApplicationService>('TransferPsosApplicationService', () => {
            const transferPsosDomainService = this.resolve<TransferPsosDomainService>('TransferPsosDomainService');
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new TransferPsosApplicationService(transferPsosDomainService, authorizationService);
          });

          // Register Send Snapshot services
          this.register<SendSnapshotDomainService>('SendSnapshotDomainService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const blobStorageService = this.resolve<IBlobStorageService>('BlobStorageService');
            const chatService = this.resolve<IChatService>('ChatService');
            const snapshotRepository = this.resolve<ISnapshotRepository>('ISnapshotRepository');
            return new SendSnapshotDomainService(userRepository, blobStorageService, chatService, snapshotRepository);
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
            const authorizationService = this.resolve<AuthorizationService>('AuthorizationService');
            return new DeleteSnapshotApplicationService(deleteSnapshotDomainService, authorizationService);
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
            return new WebSocketConnectionDomainService(presenceDomainService, streamingSessionDomainService, webPubSubService);
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
    
    ServiceContainer.initialized = true;
  }
}

/**
 * Global service container instance
 */
export const serviceContainer = ServiceContainer.getInstance();
