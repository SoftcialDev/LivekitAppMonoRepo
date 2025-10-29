/**
 * @fileoverview Tests for DeleteSnapshotApplicationService
 * @description Tests for delete snapshot application service
 */

import { DeleteSnapshotApplicationService } from '../../../../shared/application/services/DeleteSnapshotApplicationService';
import { DeleteSnapshotDomainService } from '../../../../shared/domain/services/DeleteSnapshotDomainService';
import { AuthorizationService } from '../../../../shared/domain/services/AuthorizationService';
import { DeleteSnapshotRequest } from '../../../../shared/domain/value-objects/DeleteSnapshotRequest';
import { DeleteSnapshotResponse } from '../../../../shared/domain/value-objects/DeleteSnapshotResponse';
import { UserRole } from '../../../../shared/domain/enums/UserRole';

describe('DeleteSnapshotApplicationService', () => {
  let deleteSnapshotApplicationService: DeleteSnapshotApplicationService;
  let mockDeleteSnapshotDomainService: jest.Mocked<DeleteSnapshotDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeleteSnapshotDomainService = {
      deleteSnapshot: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserWithRoles: jest.fn(),
    } as any;

    deleteSnapshotApplicationService = new DeleteSnapshotApplicationService(
      mockDeleteSnapshotDomainService,
      mockAuthorizationService
    );
  });

  describe('constructor', () => {
    it('should create DeleteSnapshotApplicationService instance', () => {
      expect(deleteSnapshotApplicationService).toBeInstanceOf(DeleteSnapshotApplicationService);
    });
  });

  describe('deleteSnapshot', () => {
    it('should delete snapshot successfully when user is authorized as Admin', async () => {
      const callerId = 'admin-user-id';
      const request = {
        snapshotId: 'snapshot-123',
        callerId: callerId,
        reason: 'Outdated snapshot',
        timestamp: new Date(),
      } as any;

      const expectedResponse = {
        success: true,
        message: 'Snapshot deleted successfully',
        deletedSnapshotId: 'snapshot-123',
        timestamp: new Date(),
      } as any;

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockDeleteSnapshotDomainService.deleteSnapshot.mockResolvedValue(expectedResponse);

      const result = await deleteSnapshotApplicationService.deleteSnapshot(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'deleting snapshots'
      );
      expect(mockDeleteSnapshotDomainService.deleteSnapshot).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should delete snapshot successfully when user is authorized as SuperAdmin', async () => {
      const callerId = 'superadmin-user-id';
      const request= {
        snapshotId: 'snapshot-456',
        callerId: callerId,
        reason: 'Invalid snapshot data',
        timestamp: new Date(),
      } as any;

      const expectedResponse= {
        success: true,
        message: 'Snapshot deleted successfully',
        deletedSnapshotId: 'snapshot-456',
        timestamp: new Date(),
      } as any;

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockDeleteSnapshotDomainService.deleteSnapshot.mockResolvedValue(expectedResponse);

      const result = await deleteSnapshotApplicationService.deleteSnapshot(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'deleting snapshots'
      );
      expect(mockDeleteSnapshotDomainService.deleteSnapshot).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'unauthorized-user-id';
      const request= {
        snapshotId: 'snapshot-789',
        reason: 'Test deletion',
        timestamp: new Date(),
      } as any;

      const authError = new Error('User is not authorized to delete snapshots');
      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(authError);

      await expect(deleteSnapshotApplicationService.deleteSnapshot(callerId, request))
        .rejects.toThrow('User is not authorized to delete snapshots');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'deleting snapshots'
      );
      expect(mockDeleteSnapshotDomainService.deleteSnapshot).not.toHaveBeenCalled();
    });

    it('should handle domain service errors', async () => {
      const callerId = 'admin-user-id';
      const request= {
        snapshotId: 'snapshot-error',
        callerId: callerId,
        reason: 'Test deletion',
        timestamp: new Date(),
      } as any;

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      const domainError = new Error('Failed to delete snapshot from database');
      mockDeleteSnapshotDomainService.deleteSnapshot.mockRejectedValue(domainError);

      await expect(deleteSnapshotApplicationService.deleteSnapshot(callerId, request))
        .rejects.toThrow('Failed to delete snapshot from database');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'deleting snapshots'
      );
      expect(mockDeleteSnapshotDomainService.deleteSnapshot).toHaveBeenCalledWith(request);
    });

    it('should handle different snapshot IDs', async () => {
      const callerId = 'admin-user-id';
      const request1= {
        snapshotId: 'snapshot-1',
        callerId: callerId,
        reason: 'First snapshot deletion',
        timestamp: new Date(),
      } as any;

      const request2= {
        snapshotId: 'snapshot-2',
        callerId: callerId,
        reason: 'Second snapshot deletion',
        timestamp: new Date(),
      } as any;

      const expectedResponse1= {
        success: true,
        message: 'Snapshot deleted successfully',
        deletedSnapshotId: 'snapshot-1',
        timestamp: new Date(),
      } as any;

      const expectedResponse2= {
        success: true,
        message: 'Snapshot deleted successfully',
        deletedSnapshotId: 'snapshot-2',
        timestamp: new Date(),
      } as any;

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockDeleteSnapshotDomainService.deleteSnapshot
        .mockResolvedValueOnce(expectedResponse1)
        .mockResolvedValueOnce(expectedResponse2);

      const result1 = await deleteSnapshotApplicationService.deleteSnapshot(callerId, request1);
      const result2 = await deleteSnapshotApplicationService.deleteSnapshot(callerId, request2);

      expect(mockDeleteSnapshotDomainService.deleteSnapshot).toHaveBeenCalledWith(request1);
      expect(mockDeleteSnapshotDomainService.deleteSnapshot).toHaveBeenCalledWith(request2);
      expect(result1).toBe(expectedResponse1);
      expect(result2).toBe(expectedResponse2);
    });

    it('should handle snapshot deletion with minimal request data', async () => {
      const callerId = 'admin-user-id';
      const request= {
        snapshotId: 'snapshot-minimal',
        callerId: callerId,
        timestamp: new Date(),
      } as any;

      const expectedResponse= {
        success: true,
        message: 'Snapshot deleted successfully',
        deletedSnapshotId: 'snapshot-minimal',
        timestamp: new Date(),
      } as any;

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockDeleteSnapshotDomainService.deleteSnapshot.mockResolvedValue(expectedResponse);

      const result = await deleteSnapshotApplicationService.deleteSnapshot(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Admin, UserRole.SuperAdmin],
        'deleting snapshots'
      );
      expect(mockDeleteSnapshotDomainService.deleteSnapshot).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });
  });
});
