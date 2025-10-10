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

/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
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
    // Register repositories
    this.register<IUserRepository>('UserRepository', () => new UserRepository() as IUserRepository);
    this.register<ISupervisorRepository>('SupervisorRepository', () => new SupervisorRepository());

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
          this.register<IAuditService>('AuditService', () => new AuditService());
          this.register<IPresenceService>('PresenceService', () => new PresenceService());

          // Register application services
          this.register<UserDeletionApplicationService>('UserDeletionApplicationService', () => {
            const userRepository = this.resolve<IUserRepository>('UserRepository');
            const authorizationService = this.resolve<IAuthorizationService>('AuthorizationService');
            const auditService = this.resolve<IAuditService>('AuditService');
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
        }
      }

/**
 * Global service container instance
 */
export const serviceContainer = ServiceContainer.getInstance();
