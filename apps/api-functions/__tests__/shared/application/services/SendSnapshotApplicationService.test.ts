/**
 * @fileoverview Tests for SendSnapshotApplicationService
 * @description Tests for send snapshot application service
 */

import { SendSnapshotApplicationService } from '../../../../shared/application/services/SendSnapshotApplicationService';
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
    it('should send snapshot successfully when user is authorized as Supervisor', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = 'John Doe';
      const token = 'test-token';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      const result = await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token);
      expect(result).toBe(expectedResponse);
    });

    it('should send snapshot successfully when user is authorized as Admin', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = 'John Doe';
      const token = 'test-token';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      const result = await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token);
      expect(result).toBe(expectedResponse);
    });

    it('should send snapshot successfully when user is authorized as SuperAdmin', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = 'John Doe';
      const token = 'test-token';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      const result = await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = 'John Doe';
      const token = 'test-token';

      const authError = new Error('User not authorized');
      mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(authError);

      await expect(sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token))
        .rejects.toThrow('User not authorized');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).not.toHaveBeenCalled();
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = 'John Doe';
      const token = 'test-token';

      const domainError = new Error('Domain service error');
      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockRejectedValue(domainError);

      await expect(sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token))
        .rejects.toThrow('Domain service error');

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token);
    });

    it('should handle different snapshot requests', async () => {
      const callerId = 'test-caller-id';
      const request1 = new SendSnapshotRequest('test-caller-id', 'pso1@example.com', 'Message 1', 'base64-image-data-1');
      const request2 = new SendSnapshotRequest('test-caller-id', 'pso2@example.com', 'Message 2', 'base64-image-data-2');
      const supervisorName = 'John Doe';
      const token = 'test-token';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      await sendSnapshotApplicationService.sendSnapshot(callerId, request1, supervisorName, token);
      await sendSnapshotApplicationService.sendSnapshot(callerId, request2, supervisorName, token);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledTimes(2);
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request1, supervisorName, token);
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request2, supervisorName, token);
    });

    it('should handle different supervisor names', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName1 = 'John Doe';
      const supervisorName2 = 'Jane Smith';
      const token = 'test-token';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName1, token);
      await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName2, token);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledTimes(2);
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName1, token);
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName2, token);
    });

    it('should handle different tokens', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = 'John Doe';
      const token1 = 'token-1';
      const token2 = 'token-2';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token1);
      await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token2);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledTimes(2);
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token1);
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token2);
    });

    it('should handle empty supervisor name', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = '';
      const token = 'test-token';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      const result = await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token);
      expect(result).toBe(expectedResponse);
    });

    it('should handle empty token', async () => {
      const callerId = 'test-caller-id';
      const request = new SendSnapshotRequest('test-caller-id', 'pso@example.com', 'Test message', 'base64-image-data');
      const supervisorName = 'John Doe';
      const token = '';
      const expectedResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

      mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
      mockSendSnapshotDomainService.sendSnapshot.mockResolvedValue(expectedResponse);

      const result = await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token);

      expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
        callerId,
        [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
        'sending snapshots'
      );
      expect(mockSendSnapshotDomainService.sendSnapshot).toHaveBeenCalledWith(request, supervisorName, token);
      expect(result).toBe(expectedResponse);
    });
  });
});
