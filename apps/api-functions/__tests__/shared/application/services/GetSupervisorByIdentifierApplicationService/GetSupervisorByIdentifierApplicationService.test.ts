/**
 * @fileoverview GetSupervisorByIdentifierApplicationService - unit tests
 * @summary Tests for GetSupervisorByIdentifierApplicationService functionality
 * @description Validates supervisor lookup operations, authorization, and business logic
 */

import { GetSupervisorByIdentifierApplicationService } from '../../../../../shared/application/services/GetSupervisorByIdentifierApplicationService';
import { GetSupervisorByIdentifierRequest } from '../../../../../shared/domain/value-objects/GetSupervisorByIdentifierRequest';
import { GetSupervisorByIdentifierResponse } from '../../../../../shared/domain/value-objects/GetSupervisorByIdentifierResponse';
import { GetSupervisorByIdentifierDomainService } from '../../../../../shared/domain/services/GetSupervisorByIdentifierDomainService';
import { AuthorizationService } from '../../../../../shared/domain/services/AuthorizationService';

// Mock dependencies
const mockGetSupervisorByIdentifierDomainService: jest.Mocked<GetSupervisorByIdentifierDomainService> = {
  getSupervisorByIdentifier: jest.fn()
} as any;

const mockAuthorizationService: jest.Mocked<AuthorizationService> = {
  authorizeUserQuery: jest.fn(),
  authorizeUserWithRoles: jest.fn(),
  canAccessAdmin: jest.fn(),
  canManageUsers: jest.fn(),
  canManageSupervisors: jest.fn(),
  canAccessUserData: jest.fn(),
  canManageContactManagers: jest.fn(),
  canManageSuperAdmins: jest.fn(),
  canDeleteUsers: jest.fn(),
  canChangeUserRoles: jest.fn(),
  canChangeSupervisors: jest.fn()
} as any;

describe('GetSupervisorByIdentifierApplicationService', () => {
  let service: GetSupervisorByIdentifierApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GetSupervisorByIdentifierApplicationService(
      mockGetSupervisorByIdentifierDomainService,
      mockAuthorizationService
    );
  });

  describe('constructor', () => {
    it('should create service with dependencies', () => {
      expect(service).toBeInstanceOf(GetSupervisorByIdentifierApplicationService);
    });
  });

  describe('getSupervisorByIdentifier', () => {
    it('should return supervisor when user is authorized', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor-456');

      const expectedResponse = new GetSupervisorByIdentifierResponse({
        id: 'supervisor-456',
        azureAdObjectId: 'supervisor-456',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorByIdentifier(callerId, request);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should return supervisor by email identifier', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor@example.com');

      const expectedResponse = new GetSupervisorByIdentifierResponse({
        id: 'supervisor-789',
        azureAdObjectId: 'supervisor-789',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Email'
      });

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorByIdentifier(callerId, request);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should return supervisor by Azure AD object ID', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('azure-ad-object-id-123');

      const expectedResponse = new GetSupervisorByIdentifierResponse({
        id: 'supervisor-azure-123',
        azureAdObjectId: 'azure-ad-object-id-123',
        email: 'supervisor.azure@example.com',
        fullName: 'Azure Supervisor'
      });

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorByIdentifier(callerId, request);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor-456');

      mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('User not authorized'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('User not authorized');

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).not.toHaveBeenCalled();
    });

    it('should handle domain service errors', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor-456');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockRejectedValue(new Error('Supervisor not found'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Supervisor not found');

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
    });

    it('should handle request with invalid identifier', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('invalid-identifier');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockRejectedValue(new Error('Invalid identifier format'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Invalid identifier format');

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
    });

    it('should handle request with empty identifier', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockRejectedValue(new Error('Identifier cannot be empty'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Identifier cannot be empty');

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
    });
  });

  describe('error handling', () => {
    it('should propagate authorization errors', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor-456');

      mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('Invalid token'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Invalid token');
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor-456');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Database connection failed');
    });

    it('should handle authorization timeout', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor-456');

      mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('Authorization timeout'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Authorization timeout');
    });
  });

  describe('edge cases', () => {
    it('should handle supervisor not found', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('non-existent-supervisor');

      const expectedResponse = new GetSupervisorByIdentifierResponse(undefined, 'Supervisor not found');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorByIdentifier(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.supervisor).toBeUndefined();
    });

    it('should handle inactive supervisor', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('inactive-supervisor-123');

      const expectedResponse = new GetSupervisorByIdentifierResponse({
        id: 'inactive-supervisor-123',
        azureAdObjectId: 'inactive-supervisor-123',
        email: 'inactive@example.com',
        fullName: 'Inactive Supervisor'
      });

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorByIdentifier(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.supervisor).toBeDefined();
    });

    it('should handle supervisor with special characters in identifier', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorByIdentifierRequest('supervisor@domain.com#special');

      const expectedResponse = new GetSupervisorByIdentifierResponse({
        id: 'supervisor-special-123',
        azureAdObjectId: 'supervisor-special-123',
        email: 'supervisor@domain.com#special',
        fullName: 'Special Supervisor'
      });

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorByIdentifier(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.supervisor?.email).toBe('supervisor@domain.com#special');
    });

    it('should handle very long identifier', async () => {
      const callerId = 'user-123';
      const longIdentifier = 'a'.repeat(1000);
      const request = new GetSupervisorByIdentifierRequest(longIdentifier);

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier.mockRejectedValue(new Error('Identifier too long'));

      await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Identifier too long');

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorByIdentifierDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
    });
  });
});
