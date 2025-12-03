/**
 * @fileoverview Tests for SendSnapshotApplicationService
 * @description Tests for send snapshot application service
 */

import { SendSnapshotApplicationService } from '../../../../shared/application/services/SendSnapshotApplicationService';
import { SnapshotReason } from '../../../../shared/domain/enums/SnapshotReason';
import { SendSnapshotRequest } from '../../../../shared/domain/value-objects/SendSnapshotRequest';
import { SendSnapshotResponse } from '../../../../shared/domain/value-objects/SendSnapshotResponse';
import { SendSnapshotDomainService } from '../../../../shared/domain/services/SendSnapshotDomainService';
import { AuthorizationService } from '../../../../shared/domain/services/AuthorizationService';
import { UserRole } from '../../../../shared/domain/enums/UserRole';

// Mock dependencies
jest.mock('../../../../shared/domain/services/SendSnapshotDomainService');
jest.mock('../../../../shared/domain/services/AuthorizationService');

describe('SendSnapshotApplicationService', () => {
  let sendSnapshotApplicationService: SendSnapshotApplicationService;
  let mockSendSnapshotDomainService: jest.Mocked<SendSnapshotDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSendSnapshotDomainService = {
      sendSnapshot: jest.fn()
    } as any;

    mockAuthorizationService = {
      authorizeUserWithRoles: jest.fn()
    } as any;

    sendSnapshotApplicationService = new SendSnapshotApplicationService(
      mockSendSnapshotDomainService,
      mockAuthorizationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create SendSnapshotApplicationService instance', () => {
      expect(sendSnapshotApplicationService).toBeInstanceOf(SendSnapshotApplicationService);
    });
  });

  describe('sendSnapshot', () => {
    it('authorizes allowed roles and delegates to the domain service', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', SnapshotReason.PERFORMANCE, undefined, 'base64-image-data');
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      const result = await sendSnapshotApplicationService.sendSnapshot(callerId, request);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('propagates authorization failures', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', SnapshotReason.PERFORMANCE, undefined, 'base64-image-data');
      const authError = new Error('User not authorized');

      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(authError);

      await expect(sendSnapshotApplicationService.sendSnapshot(callerId, request)).rejects.toThrow(
        'User not authorized'
      );

      expect(mockSendSnapshotDomainService.sendSnapshot).not.toHaveBeenCalled();
    });

    it('propagates domain service failures', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', SnapshotReason.PERFORMANCE, undefined, 'base64-image-data');
      const domainError = new Error('Domain service error');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockRejectedValue(domainError);

      await expect(sendSnapshotApplicationService.sendSnapshot(callerId, request)).rejects.toThrow(
        'Domain service error'
      );

      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request);
    });
  });
});
