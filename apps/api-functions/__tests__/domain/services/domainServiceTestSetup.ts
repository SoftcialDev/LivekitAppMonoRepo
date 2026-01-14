import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ISupervisorRepository } from '../../../src/domain/interfaces/ISupervisorRepository';
import { IChatService } from '../../../src/domain/interfaces/IChatService';
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

