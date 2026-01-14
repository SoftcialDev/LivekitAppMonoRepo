import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ISupervisorRepository } from '../../../src/domain/interfaces/ISupervisorRepository';
import { IChatService } from '../../../src/domain/interfaces/IChatService';
import { IPendingCommandRepository } from '../../../src/domain/interfaces/IPendingCommandRepository';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import { ITalkSessionRepository } from '../../../src/domain/interfaces/ITalkSessionRepository';
import { ICommandMessagingService } from '../../../src/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { IStreamingSessionDomainService } from '../../../src/domain/interfaces/IStreamingSessionDomainService';
import { IStreamingSessionRepository } from '../../../src/domain/interfaces/IStreamingSessionRepository';
import { ISnapshotRepository } from '../../../src/domain/interfaces/ISnapshotRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { ILiveKitService } from '../../../src/domain/interfaces/ILiveKitService';
import { IUserRoleAssignmentRepository } from '../../../src/domain/interfaces/IUserRoleAssignmentRepository';
import { IPermissionRepository } from '../../../src/domain/interfaces/IPermissionRepository';
import { IContactManagerFormRepository } from '../../../src/domain/interfaces/IContactManagerFormRepository';
import { IPresenceRepository } from '../../../src/domain/interfaces/IPresenceRepository';
import { IErrorLogRepository } from '../../../src/domain/interfaces/IErrorLogRepository';
import { IRecordingSessionRepository } from '../../../src/domain/interfaces/IRecordingSessionRepository';
import { ICameraStartFailureRepository } from '../../../src/domain/interfaces/ICameraStartFailureRepository';
import { PendingCommandDomainService } from '../../../src/domain/services/PendingCommandDomainService';
import { StreamingSessionDomainService } from '../../../src/domain/services/StreamingSessionDomainService';
import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { TalkSessionDomainService } from '../../../src/domain/services/TalkSessionDomainService';
import { RecordingSessionApplicationService } from '../../../src/application/services/RecordingSessionApplicationService';
import { LiveKitRecordingService } from '../../../src/infrastructure/services/LiveKitRecordingService';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';
import { StreamingSessionHistory } from '../../../src/domain/entities/StreamingSessionHistory';

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
    existsAndActive: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    findAllUsers: jest.fn(),
    isPSO: jest.fn(),
    updateSupervisor: jest.fn(),
    createPSO: jest.fn(),
    deleteUser: jest.fn(),
    findByRoles: jest.fn(),
    findUsersWithUnassignedRole: jest.fn(),
    createContactManager: jest.fn(),
    createSuperAdmin: jest.fn(),
    createSuperAdminAuditLog: jest.fn(),
    findAllSuperAdmins: jest.fn(),
    getActiveRolesByAzureId: jest.fn(),
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
    markAsAcknowledged: jest.fn(),
    findByIds: jest.fn(),
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
    updateBatch: jest.fn(),
  } as any;
};

export const createMockTalkSessionRepository = (): jest.Mocked<ITalkSessionRepository> => {
  return {
    createTalkSession: jest.fn(),
    getActiveTalkSessionsForPso: jest.fn(),
    getActiveTalkSessionsForSupervisor: jest.fn(),
    findByIdWithPso: jest.fn(),
    stopTalkSession: jest.fn(),
    getAllTalkSessionsWithRelations: jest.fn(),
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
    broadcastPresence: jest.fn(),
    syncAllUsersWithDatabase: jest.fn(),
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
    deleteRecordingByPath: jest.fn(),
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
    findById: jest.fn(),
  } as any;
};

export const createMockPresenceRepository = (): jest.Mocked<IPresenceRepository> => {
  return {
    upsertPresence: jest.fn(),
    createPresenceHistory: jest.fn(),
    closeOpenPresenceHistory: jest.fn(),
    findPresenceByUserId: jest.fn(),
  } as any;
};

export const createMockErrorLogRepository = (): jest.Mocked<IErrorLogRepository> => {
  return {
    create: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    markAsResolved: jest.fn(),
    deleteById: jest.fn(),
    deleteMany: jest.fn(),
    deleteAll: jest.fn(),
    count: jest.fn(),
  } as any;
};

export const createMockRecordingSessionRepository = (): jest.Mocked<IRecordingSessionRepository> => {
  return {
    findById: jest.fn(),
    list: jest.fn(),
    getUsersByIds: jest.fn(),
    createActive: jest.fn(),
    complete: jest.fn(),
    deleteById: jest.fn(),
  } as any;
};

export const createMockStreamingSessionRepository = (): jest.Mocked<IStreamingSessionRepository> => {
  return {
    getLatestSessionForUser: jest.fn(),
    createSession: jest.fn(),
    updateSession: jest.fn(),
    getSessionsForUserInDateRange: jest.fn(),
    getActiveSessions: jest.fn(),
    getActiveSessionsForSupervisor: jest.fn(),
    startStreamingSession: jest.fn(),
    stopStreamingSession: jest.fn(),
    getLastStreamingSession: jest.fn(),
    isUserStreaming: jest.fn(),
    getLatestSessionsForEmails: jest.fn(),
  } as any;
};

export const createMockCameraStartFailureRepository = (): jest.Mocked<ICameraStartFailureRepository> => {
  return {
    create: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    count: jest.fn(),
  } as any;
};

export const createMockPendingCommandDomainService = (): jest.Mocked<PendingCommandDomainService> => {
  return {
    createPendingCommand: jest.fn(),
    markAsPublished: jest.fn(),
    fetchPendingCommands: jest.fn(),
  } as any;
};

export const createMockStreamingSessionDomainServiceInstance = (): jest.Mocked<StreamingSessionDomainService> => {
  return {
    startStreamingSession: jest.fn(),
    stopStreamingSession: jest.fn(),
    getLastStreamingSession: jest.fn(),
    isUserStreaming: jest.fn(),
  } as any;
};

export const createMockPresenceDomainServiceInstance = (): jest.Mocked<PresenceDomainService> => {
  return {
    setUserOnline: jest.fn(),
    setUserOffline: jest.fn(),
    getPresenceStatus: jest.fn(),
  } as any;
};

export const createMockTalkSessionDomainService = (): jest.Mocked<TalkSessionDomainService> => {
  return {
    startTalkSession: jest.fn(),
    stopTalkSession: jest.fn(),
    broadcastTalkStoppedEvent: jest.fn(),
  } as any;
};

export const createMockLiveKitRecordingService = (): jest.Mocked<LiveKitRecordingService> => {
  return {
    stopAllForUser: jest.fn(),
  } as any;
};

export const createMockRecordingSessionApplicationService = (): jest.Mocked<RecordingSessionApplicationService> => {
  return {
    startRecordingSession: jest.fn(),
    stopAllRecordingsForUser: jest.fn(),
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

export const createMockStreamingSessionHistory = (overrides?: Partial<{
  id: string;
  userId: string;
  startedAt: Date;
  stoppedAt: Date | null;
  stopReason: string | null;
}>): StreamingSessionHistory => {
  return new StreamingSessionHistory({
    id: overrides?.id || 'session-id',
    userId: overrides?.userId || 'user-id',
    startedAt: overrides?.startedAt || new Date(),
    stoppedAt: overrides?.stoppedAt || null,
    stopReason: overrides?.stopReason || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

