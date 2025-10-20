/**
 * @fileoverview GetSnapshotsApplicationService - unit tests
 * @summary Tests for GetSnapshotsApplicationService functionality
 * @description Validates snapshot retrieval operations, authorization, and business logic
 */

import { GetSnapshotsApplicationService } from '../../../../../shared/application/services/GetSnapshotsApplicationService';
import { GetSnapshotsRequest } from '../../../../../shared/domain/value-objects/GetSnapshotsRequest';
import { GetSnapshotsResponse } from '../../../../../shared/domain/value-objects/GetSnapshotsResponse';
import { GetSnapshotsDomainService } from '../../../../../shared/domain/services/GetSnapshotsDomainService';
import { AuthorizationService } from '../../../../../shared/domain/services/AuthorizationService';
import { UserRole } from '../../../../../shared/domain/enums/UserRole';

// Mock dependencies
const mockGetSnapshotsDomainService: jest.Mocked<GetSnapshotsDomainService> = {
  getSnapshots: jest.fn()
} as any;

const mockAuthorizationService: jest.Mocked<AuthorizationService> = {
  authorizeUserWithRoles: jest.fn(),
  authorizeUserQuery: jest.fn(),
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

describe('GetSnapshotsApplicationService', () => {
  let service: GetSnapshotsApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GetSnapshotsApplicationService(
      mockGetSnapshotsDomainService,
      mockAuthorizationService
    );
  });

  describe('constructor', () => {
    it('should create service with dependencies', () => {
      expect(service).toBeInstanceOf(GetSnapshotsApplicationService);
    });
  });

  describe('getSnapshots', () => {
    it('should return snapshots when admin is authorized', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      const expectedResponse = new GetSnapshotsResponse([
        {
          id: 'snapshot-1',
          supervisorName: 'Supervisor One',
          psoFullName: 'PSO One',
          psoEmail: 'pso1@example.com',
          reason: 'Performance review',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2023-01-01T10:00:00Z'
        },
        {
          id: 'snapshot-2',
          supervisorName: 'Supervisor Two',
          psoFullName: 'PSO Two',
          psoEmail: 'pso2@example.com',
          reason: 'Training session',
          imageUrl: 'https://example.com/snapshot2.jpg',
          takenAt: '2023-01-01T11:00:00Z'
        }
      ]);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockResolvedValue(expectedResponse);

      const result = await service.getSnapshots(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should return snapshots when super admin is authorized', async () => {
      const callerId = 'superadmin-123';
      const request = new GetSnapshotsRequest(callerId);

      const expectedResponse = new GetSnapshotsResponse([
        {
          id: 'snapshot-3',
          supervisorName: 'Supervisor Three',
          psoFullName: 'PSO Three',
          psoEmail: 'pso3@example.com',
          reason: 'Quality check',
          imageUrl: 'https://example.com/snapshot3.jpg',
          takenAt: '2023-01-01T12:00:00Z'
        }
      ]);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockResolvedValue(expectedResponse);

      const result = await service.getSnapshots(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'employee-123';
      const request = new GetSnapshotsRequest(callerId);

      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Insufficient privileges'));

      await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Insufficient privileges');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).not.toHaveBeenCalled();
    });

    it('should throw error when supervisor tries to access snapshots', async () => {
      const callerId = 'supervisor-123';
      const request = new GetSnapshotsRequest(callerId);

      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Access denied: insufficient role privileges'));

      await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Access denied: insufficient role privileges');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).not.toHaveBeenCalled();
    });

    it('should throw error when contact manager tries to access snapshots', async () => {
      const callerId = 'contactmanager-123';
      const request = new GetSnapshotsRequest(callerId);

      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Access denied: insufficient role privileges'));

      await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Access denied: insufficient role privileges');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).not.toHaveBeenCalled();
    });

    it('should handle domain service errors', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Database connection failed');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).toHaveBeenCalledWith(request);
    });

    it('should handle request with filters', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      const expectedResponse = new GetSnapshotsResponse([
        {
          id: 'snapshot-filtered-1',
          supervisorName: 'Supervisor Filtered',
          psoFullName: 'PSO Filtered',
          psoEmail: 'pso-filtered@example.com',
          reason: 'Filtered test',
          imageUrl: 'https://example.com/snapshot-filtered1.jpg',
          takenAt: '2023-01-15T10:00:00Z'
        }
      ]);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockResolvedValue(expectedResponse);

      const result = await service.getSnapshots(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('error handling', () => {
    it('should propagate authorization errors', async () => {
      const callerId = 'user-123';
      const request = new GetSnapshotsRequest(callerId);

      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Invalid token'));

      await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Invalid token');
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockRejectedValue(new Error('Snapshot service unavailable'));

      await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Snapshot service unavailable');
    });

    it('should handle authorization timeout', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Authorization timeout'));

      await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Authorization timeout');
    });
  });

  describe('edge cases', () => {
    it('should handle empty snapshots response', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      const expectedResponse = new GetSnapshotsResponse([]);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockResolvedValue(expectedResponse);

      const result = await service.getSnapshots(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.reports).toHaveLength(0);
    });

    it('should handle large snapshots response', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      const snapshots = Array.from({ length: 100 }, (_, i) => ({
        id: `snapshot-${i}`,
        supervisorName: `Supervisor ${i}`,
        psoFullName: `PSO ${i}`,
        psoEmail: `pso${i}@example.com`,
        reason: `Test reason ${i}`,
        imageUrl: `https://example.com/snapshot${i}.jpg`,
        takenAt: `2023-01-01T${10 + (i % 24)}:00:00Z`
      }));

      const expectedResponse = new GetSnapshotsResponse(snapshots);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockResolvedValue(expectedResponse);

      const result = await service.getSnapshots(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.reports).toHaveLength(100);
    });

    it('should handle request with all possible filters', async () => {
      const callerId = 'admin-123';
      const request = new GetSnapshotsRequest(callerId);

      const expectedResponse = new GetSnapshotsResponse([
        {
          id: 'snapshot-complex-1',
          supervisorName: 'Supervisor Complex',
          psoFullName: 'PSO Complex',
          psoEmail: 'pso-complex@example.com',
          reason: 'Complex test',
          imageUrl: 'https://example.com/snapshot-complex1.jpg',
          takenAt: '2023-01-15T10:00:00Z'
        }
      ]);

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue();
      mockGetSnapshotsDomainService.getSnapshots.mockResolvedValue(expectedResponse);

      const result = await service.getSnapshots(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'viewing snapshots'
      );
      expect(mockGetSnapshotsDomainService.getSnapshots).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });
  });
});
