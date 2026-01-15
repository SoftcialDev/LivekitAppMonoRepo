import { UserSummary } from '../../../src/domain/entities/UserSummary';
import { UserRole } from '@prisma/client';

describe('UserSummary', () => {
  const baseData = {
    azureAdObjectId: 'azure-id',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.PSO,
  };

  describe('constructor', () => {
    it('should create UserSummary with all properties', () => {
      const userSummary = new UserSummary(baseData);

      expect(userSummary.azureAdObjectId).toBe(baseData.azureAdObjectId);
      expect(userSummary.email).toBe(baseData.email);
      expect(userSummary.firstName).toBe(baseData.firstName);
      expect(userSummary.lastName).toBe(baseData.lastName);
      expect(userSummary.role).toBe(baseData.role);
    });

    it('should create UserSummary with optional supervisor properties', () => {
      const dataWithSupervisor = {
        ...baseData,
        supervisorAdId: 'supervisor-id',
        supervisorName: 'Supervisor Name',
      };

      const userSummary = new UserSummary(dataWithSupervisor);

      expect(userSummary.supervisorAdId).toBe('supervisor-id');
      expect(userSummary.supervisorName).toBe('Supervisor Name');
    });

    it('should create UserSummary with null role', () => {
      const dataWithNullRole = {
        ...baseData,
        role: null,
      };

      const userSummary = new UserSummary(dataWithNullRole);

      expect(userSummary.role).toBeNull();
    });

    it('should create UserSummary without supervisor properties', () => {
      const userSummary = new UserSummary(baseData);

      expect(userSummary.supervisorAdId).toBeUndefined();
      expect(userSummary.supervisorName).toBeUndefined();
    });
  });

  describe('fromPrismaUser', () => {
    it('should create UserSummary from Prisma user with full name', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: 'John Doe',
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.azureAdObjectId).toBe(prismaUser.azureAdObjectId);
      expect(userSummary.email).toBe(prismaUser.email);
      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('Doe');
      expect(userSummary.role).toBe(prismaUser.role);
    });

    it('should create UserSummary from Prisma user with single name', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: 'John',
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('');
    });

    it('should create UserSummary from Prisma user with multiple names', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: 'John Michael Doe',
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('Michael');
    });

    it('should create UserSummary from Prisma user with null fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: null,
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.firstName).toBe('');
      expect(userSummary.lastName).toBe('');
    });

    it('should create UserSummary from Prisma user with empty fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: '',
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.firstName).toBe('');
      expect(userSummary.lastName).toBe('');
    });

    it('should create UserSummary from Prisma user with supervisor', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: 'John Doe',
        role: UserRole.PSO,
        supervisor: {
          azureAdObjectId: 'supervisor-id',
          fullName: 'Supervisor Name',
        },
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.supervisorAdId).toBe('supervisor-id');
      expect(userSummary.supervisorName).toBe('Supervisor Name');
    });

    it('should create UserSummary from Prisma user with supervisor with null fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: 'John Doe',
        role: UserRole.PSO,
        supervisor: {
          azureAdObjectId: 'supervisor-id',
          fullName: null,
        },
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.supervisorAdId).toBe('supervisor-id');
      expect(userSummary.supervisorName).toBeUndefined();
    });

    it('should create UserSummary from Prisma user with null supervisor', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: 'John Doe',
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.supervisorAdId).toBeUndefined();
      expect(userSummary.supervisorName).toBeUndefined();
    });

    it('should handle names with extra whitespace', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: '  John   Doe  ',
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('Doe');
    });
  });

  describe('splitName', () => {
    it('should split full name correctly', () => {
      const prismaUser = {
        azureAdObjectId: 'azure-id',
        email: 'test@example.com',
        fullName: 'First Last',
        role: UserRole.PSO,
        supervisor: null,
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);

      expect(userSummary.firstName).toBe('First');
      expect(userSummary.lastName).toBe('Last');
    });
  });
});

