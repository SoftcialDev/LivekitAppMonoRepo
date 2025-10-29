/**
 * @fileoverview Tests for UserRoleChangeApplicationService
 * @description Tests for user role change application service
 */

// Mock Prisma enums using centralized mock
jest.mock('@prisma/client', () => require('../../../mocks/prisma-enums').PrismaMock);

// Mock dependencies
jest.mock('../../../../shared/domain/utils/AuthorizationUtils');
jest.mock('../../../../shared/domain/utils/ValidationUtils');
jest.mock('../../../../shared/domain/utils/AuditUtils');

import { UserRoleChangeApplicationService } from '../../../../shared/application/services/UserRoleChangeApplicationService';
import { UserRoleChangeRequest } from '../../../../shared/domain/value-objects/UserRoleChangeRequest';
import { UserRoleChangeResult } from '../../../../shared/domain/value-objects/UserRoleChangeResult';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../../shared/domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../../../shared/domain/interfaces/IAuditService';
import { IPresenceService } from '../../../../shared/domain/interfaces/IPresenceService';
import { UserRoleChangeError } from '../../../../shared/domain/errors/DomainError';
import { UserRoleChangeErrorCode } from '../../../../shared/domain/errors/ErrorCodes';
import { UserRole } from '@prisma/client';

describe('UserRoleChangeApplicationService', () => {
  let userRoleChangeApplicationService: UserRoleChangeApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockAuditService: jest.Mocked<IAuditService>;
  let mockPresenceService: jest.Mocked<IPresenceService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findByEmail: jest.fn(),
      upsertUser: jest.fn(),
    } as any;

    mockAuthorizationService = {
      canManageUsers: jest.fn(),
    } as any;

    mockAuditService = {
      logAudit: jest.fn(),
    } as any;

    mockPresenceService = {
      setUserOffline: jest.fn(),
    } as any;

    userRoleChangeApplicationService = new UserRoleChangeApplicationService(
      mockUserRepository,
      mockAuthorizationService,
      mockAuditService,
      mockPresenceService
    );
  });

  describe('constructor', () => {
    it('should create UserRoleChangeApplicationService instance', () => {
      expect(userRoleChangeApplicationService).toBeInstanceOf(UserRoleChangeApplicationService);
    });
  });

  describe('authorizeRoleChange', () => {
    it('should authorize role change successfully', async () => {
      const callerId = 'test-caller-id';
      const newRole = UserRole.Employee;

      // Mock AuthorizationUtils.validateCanChangeRoles
      const { AuthorizationUtils } = require('../../../../shared/domain/utils/AuthorizationUtils');
      AuthorizationUtils.validateCanChangeRoles = jest.fn().mockResolvedValue(undefined);

      await userRoleChangeApplicationService.authorizeRoleChange(callerId, newRole);

      expect(AuthorizationUtils.validateCanChangeRoles).toHaveBeenCalledWith(
        mockAuthorizationService,
        callerId,
        newRole,
        mockUserRepository
      );
    });

    it('should throw error when authorization fails', async () => {
      const callerId = 'test-caller-id';
      const newRole = UserRole.Employee;
      const authError = new Error('User not authorized');

      // Mock AuthorizationUtils.validateCanChangeRoles to throw error
      const { AuthorizationUtils } = require('../../../../shared/domain/utils/AuthorizationUtils');
      AuthorizationUtils.validateCanChangeRoles = jest.fn().mockRejectedValue(authError);

      await expect(userRoleChangeApplicationService.authorizeRoleChange(callerId, newRole))
        .rejects.toThrow('User not authorized');

      expect(AuthorizationUtils.validateCanChangeRoles).toHaveBeenCalledWith(
        mockAuthorizationService,
        callerId,
        newRole,
        mockUserRepository
      );
    });
  });

  describe('validateRoleChangeRequest', () => {
    it('should validate role change request successfully', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Employee, new Date());

      // Mock ValidationUtils.validateEmailFormat
      const { ValidationUtils } = require('../../../../shared/domain/utils/ValidationUtils');
      ValidationUtils.validateEmailFormat = jest.fn();

      await userRoleChangeApplicationService.validateRoleChangeRequest(request);

      expect(ValidationUtils.validateEmailFormat).toHaveBeenCalledWith('user@example.com', 'User email');
    });

    it('should throw error for invalid email format', async () => {
      const request = new UserRoleChangeRequest('invalid-email', UserRole.Employee, new Date());
      const validationError = new Error('Invalid email format');

      // Mock ValidationUtils.validateEmailFormat to throw error
      const { ValidationUtils } = require('../../../../shared/domain/utils/ValidationUtils');
      ValidationUtils.validateEmailFormat = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await expect(userRoleChangeApplicationService.validateRoleChangeRequest(request))
        .rejects.toThrow('Invalid email format');

      expect(ValidationUtils.validateEmailFormat).toHaveBeenCalledWith('invalid-email', 'User email');
    });

    it('should throw error for invalid role', async () => {
      const request = new UserRoleChangeRequest('user@example.com', 'InvalidRole' as any, new Date());

      // Mock ValidationUtils.validateEmailFormat
      const { ValidationUtils } = require('../../../../shared/domain/utils/ValidationUtils');
      ValidationUtils.validateEmailFormat = jest.fn();

      await expect(userRoleChangeApplicationService.validateRoleChangeRequest(request))
        .rejects.toThrow(UserRoleChangeError);

      await expect(userRoleChangeApplicationService.validateRoleChangeRequest(request))
        .rejects.toThrow('Invalid role assignment');
    });

    it('should handle null role (deletion request)', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Unassigned, new Date());

      // Mock ValidationUtils.validateEmailFormat
      const { ValidationUtils } = require('../../../../shared/domain/utils/ValidationUtils');
      ValidationUtils.validateEmailFormat = jest.fn();

      await userRoleChangeApplicationService.validateRoleChangeRequest(request);

      expect(ValidationUtils.validateEmailFormat).toHaveBeenCalledWith('user@example.com', 'User email');
    });
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Employee, new Date());
      const callerId = 'test-caller-id';

      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.Unassigned,
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
      };

      const updatedUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser as any);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      // Mock AuditUtils.logRoleChange
      const { AuditUtils } = require('../../../../shared/domain/utils/AuditUtils');
      AuditUtils.logRoleChange = jest.fn().mockResolvedValue(undefined);

      const result = await userRoleChangeApplicationService.changeUserRole(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
        role: UserRole.Employee,
      });
      expect(AuditUtils.logRoleChange).toHaveBeenCalledWith(
        mockAuditService,
        mockUserRepository,
        callerId,
        existingUser,
        updatedUser
      );
      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith('user@example.com');
      expect(result).toBeInstanceOf(UserRoleChangeResult);
    });

    it('should create new user when user does not exist', async () => {
      const request = new UserRoleChangeRequest('newuser@example.com', UserRole.Employee, new Date());
      const callerId = 'test-caller-id';

      const updatedUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-456',
        fullName: 'newuser@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser as any);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      // Mock AuditUtils.logRoleChange
      const { AuditUtils } = require('../../../../shared/domain/utils/AuditUtils');
      AuditUtils.logRoleChange = jest.fn().mockResolvedValue(undefined);

      const result = await userRoleChangeApplicationService.changeUserRole(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        azureAdObjectId: '',
        fullName: 'newuser@example.com',
        role: UserRole.Employee,
      });
      expect(AuditUtils.logRoleChange).toHaveBeenCalledWith(
        mockAuditService,
        mockUserRepository,
        callerId,
        null,
        updatedUser
      );
      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith('newuser@example.com');
      expect(result).toBeInstanceOf(UserRoleChangeResult);
    });

    it('should handle Unassigned role assignment', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Unassigned, new Date());
      const callerId = 'test-caller-id';

      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
      };

      const updatedUser = {
        ...existingUser,
        role: UserRole.Unassigned,
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser as any);
      const { AuditUtils } = require('../../../../shared/domain/utils/AuditUtils');
      AuditUtils.logRoleChange = jest.fn().mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      const result = await userRoleChangeApplicationService.changeUserRole(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
        role: UserRole.Unassigned,
      });
      expect(result).toBeInstanceOf(UserRoleChangeResult);
    });

    it('should not set user offline for non-Employee roles', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Supervisor, new Date());
      const callerId = 'test-caller-id';

      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
      };

      const updatedUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser as any);

      // Mock AuditUtils.logRoleChange
      const { AuditUtils } = require('../../../../shared/domain/utils/AuditUtils');
      AuditUtils.logRoleChange = jest.fn().mockResolvedValue(undefined);

      const result = await userRoleChangeApplicationService.changeUserRole(request, callerId);

      expect(mockPresenceService.setUserOffline).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserRoleChangeResult);
    });

    it('should propagate domain service errors', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Employee, new Date());
      const callerId = 'test-caller-id';

      const domainError = new Error('Database error');
      mockUserRepository.findByEmail.mockRejectedValue(domainError);

      await expect(userRoleChangeApplicationService.changeUserRole(request, callerId))
        .rejects.toThrow(UserRoleChangeError);

      await expect(userRoleChangeApplicationService.changeUserRole(request, callerId))
        .rejects.toThrow('Failed to change user role: Database error');
    });

    it('should handle different role changes', async () => {
      const callerId = 'test-caller-id';

      // Test Supervisor role change
      const supervisorRequest = new UserRoleChangeRequest('user@example.com', UserRole.Supervisor, new Date());
      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
      };

      const updatedUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser as any);

      // Mock AuditUtils.logRoleChange
      const { AuditUtils } = require('../../../../shared/domain/utils/AuditUtils');
      AuditUtils.logRoleChange = jest.fn().mockResolvedValue(undefined);

      const result = await userRoleChangeApplicationService.changeUserRole(supervisorRequest, callerId);

      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
        role: UserRole.Supervisor,
      });
      expect(mockPresenceService.setUserOffline).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserRoleChangeResult);
    });
  });
});
