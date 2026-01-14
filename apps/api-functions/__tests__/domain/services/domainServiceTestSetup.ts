import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ISupervisorRepository } from '../../../src/domain/interfaces/ISupervisorRepository';
import { IChatService } from '../../../src/domain/interfaces/IChatService';
import { IPendingCommandRepository } from '../../../src/domain/interfaces/IPendingCommandRepository';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import { ITalkSessionRepository } from '../../../src/domain/interfaces/ITalkSessionRepository';
import { ICommandMessagingService } from '../../../src/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { IStreamingSessionDomainService } from '../../../src/domain/interfaces/IStreamingSessionDomainService';
import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { ISnapshotRepository } from '../../../src/domain/interfaces/ISnapshotRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { ILiveKitService } from '../../../src/domain/interfaces/ILiveKitService';
import { IUserRoleAssignmentRepository } from '../../../src/domain/interfaces/IUserRoleAssignmentRepository';
import { IPermissionRepository } from '../../../src/domain/interfaces/IPermissionRepository';
import { IContactManagerFormRepository } from '../../../src/domain/interfaces/IContactManagerFormRepository';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

export const createMockUserRepository = (): jest.Mocked<IUserRepository> => {
  return {
    findByAzureAdObjectId: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    getPsosBySupervisor: jest.fn(),
    upsertUser: jest.fn(),
    changeUserRole: jest.fn(),
    findBySupervisor: jest.fn(),
    updateMultipleSupervisors: jest.fn(),
    getEffectivePermissionCodesByAzureId: jest.fn(),
    findByRolesWithSupervisor: jest.fn(),
    findUsersWithUnassignedRoleWithSupervisor: jest.fn(),
    findContactManagerProfileByUserId: jest.fn(),
    findAllContactManagers: jest.fn(),
    findActiveUsersByRole: jest.fn(),
    createContactManagerProfile: jest.fn(),
    createContactManagerStatusHistory: jest.fn(),
    deleteContactManagerProfile: jest.fn(),
    createContactManagerAuditLog: jest.fn(),
    updateContactManagerStatus: jest.fn(),
    findContactManagerProfile: jest.fn(),
  } as any;
};

export const createMockSupervisorRepository = (): jest.Mocked<ISupervisorRepository> => {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findSupervisorByIdentifier: jest.fn(),
    findPsoByIdentifier: jest.fn(),
    isSupervisor: jest.fn(),
    validateSupervisor: jest.fn(),
  } as any;
};

export const createMockChatService = (): jest.Mocked<IChatService> => {
  return {
    getOrSyncChat: jest.fn(),
  } as any;
};

export const createMockPendingCommandRepository = (): jest.Mocked<IPendingCommandRepository> => {
  return {
    createPendingCommand: jest.fn(),
    deletePendingCommandsForPso: jest.fn(),
    markAsPublished: jest.fn(),
    getPendingCommandsForPso: jest.fn(),
  } as any;
};

export const createMockSnapshotReasonRepository = (): jest.Mocked<ISnapshotReasonRepository> => {
  return {
    findAllActive: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  } as any;
};

export const createMockTalkSessionRepository = (): jest.Mocked<ITalkSessionRepository> => {
  return {
    createTalkSession: jest.fn(),
    getActiveTalkSessionsForPso: jest.fn(),
    findByIdWithPso: jest.fn(),
    stopTalkSession: jest.fn(),
  } as any;
};

export const createMockCommandMessagingService = (): jest.Mocked<ICommandMessagingService> => {
  return {
    sendToGroup: jest.fn(),
  } as any;
};

export const createMockWebPubSubService = (): jest.Mocked<IWebPubSubService> => {
  return {
    broadcastMessage: jest.fn(),
    broadcastSupervisorChangeNotification: jest.fn(),
    generateToken: jest.fn(),
  } as any;
};

export const createMockSnapshotRepository = (): jest.Mocked<ISnapshotRepository> => {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
    findAllWithRelations: jest.fn(),
  } as any;
};

export const createMockBlobStorageService = (): jest.Mocked<IBlobStorageService> => {
  return {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
    downloadImage: jest.fn(),
  } as any;
};

export const createMockLiveKitService = (): jest.Mocked<ILiveKitService> => {
  return {
    ensureRoom: jest.fn(),
    listRooms: jest.fn(),
    generateToken: jest.fn(),
  } as any;
};

export const createMockUserRoleAssignmentRepository = (): jest.Mocked<IUserRoleAssignmentRepository> => {
  return {
    findActiveRoleAssignmentsByUserId: jest.fn(),
  } as any;
};

export const createMockPermissionRepository = (): jest.Mocked<IPermissionRepository> => {
  return {
    findByCodes: jest.fn(),
  } as any;
};

export const createMockContactManagerFormRepository = (): jest.Mocked<IContactManagerFormRepository> => {
  return {
    createForm: jest.fn(),
  } as any;
};

export const createMockStreamingSessionDomainService = (): jest.Mocked<IStreamingSessionDomainService> => {
  return {
    startStreamingSession: jest.fn(),
    stopStreamingSession: jest.fn(),
  } as any;
};

export const createMockPresenceDomainService = (): jest.Mocked<PresenceDomainService> => {
  return {
    getPresenceStatus: jest.fn(),
  } as any;
};

export const createMockUser = (overrides?: Partial<{
  id: string;
  azureAdObjectId: string;
  email: string;
  fullName: string;
  role: UserRole;
  supervisorId: string | null;
  deletedAt: Date | null;
}>): User => {
  return new User({
    id: overrides?.id || 'user-id',
    azureAdObjectId: overrides?.azureAdObjectId || 'azure-id',
    email: overrides?.email || 'user@example.com',
    fullName: overrides?.fullName || 'Test User',
    role: overrides?.role || UserRole.PSO,
    supervisorId: overrides?.supervisorId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: overrides?.deletedAt || null,
  });
};

export const createMockSupervisor = (overrides?: Partial<{
  id: string;
  azureAdObjectId: string;
  email: string;
  fullName: string;
}>): User => {
  return new User({
    id: overrides?.id || 'supervisor-id',
    azureAdObjectId: overrides?.azureAdObjectId || 'supervisor-azure-id',
    email: overrides?.email || 'supervisor@example.com',
    fullName: overrides?.fullName || 'Supervisor User',
    role: UserRole.Supervisor,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

