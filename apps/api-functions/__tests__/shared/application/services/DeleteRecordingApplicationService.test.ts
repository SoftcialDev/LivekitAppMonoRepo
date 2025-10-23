/**
 * @fileoverview Tests for DeleteRecordingApplicationService
 * @description Tests for recording deletion application service
 */

import { DeleteRecordingApplicationService } from '../../../../shared/application/services/DeleteRecordingApplicationService';
import { DeleteRecordingRequest } from '../../../../shared/domain/value-objects/DeleteRecordingRequest';
import { DeleteRecordingResponse } from '../../../../shared/domain/value-objects/DeleteRecordingResponse';
import { DeleteRecordingDomainService } from '../../../../shared/domain/services/DeleteRecordingDomainService';
import { AuthorizationService } from '../../../../shared/domain/services/AuthorizationService';

// Mock domain services
jest.mock('../../../../shared/domain/services/DeleteRecordingDomainService');
jest.mock('../../../../shared/domain/services/AuthorizationService');

describe('DeleteRecordingApplicationService', () => {
  let deleteRecordingApplicationService: DeleteRecordingApplicationService;
  let mockDeleteRecordingDomainService: jest.Mocked<DeleteRecordingDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDeleteRecordingDomainService = {
      deleteRecording: jest.fn()
    } as any;

    mockAuthorizationService = {
      canAccessSuperAdmin: jest.fn()
    } as any;

    deleteRecordingApplicationService = new DeleteRecordingApplicationService(
      mockDeleteRecordingDomainService,
      mockAuthorizationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create DeleteRecordingApplicationService instance', () => {
      expect(deleteRecordingApplicationService).toBeInstanceOf(DeleteRecordingApplicationService);
    });
  });

  describe('deleteRecording', () => {
    it('should delete recording successfully when user is authorized', async () => {
      const callerId = 'test-caller-id';
      const request = new DeleteRecordingRequest('test-recording-id');
      const expectedResponse = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'test-recording-id'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockDeleteRecordingDomainService.deleteRecording.mockResolvedValue(expectedResponse);

      const result = await deleteRecordingApplicationService.deleteRecording(callerId, request);

      expect(mockAuthorizationService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDeleteRecordingDomainService.deleteRecording).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'test-caller-id';
      const request = new DeleteRecordingRequest('test-recording-id');

      const authError = new Error('User not authorized');
      mockAuthorizationService.canAccessSuperAdmin.mockRejectedValue(authError);

      await expect(deleteRecordingApplicationService.deleteRecording(callerId, request))
        .rejects.toThrow('User not authorized');

      expect(mockAuthorizationService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDeleteRecordingDomainService.deleteRecording).not.toHaveBeenCalled();
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'test-caller-id';
      const request = new DeleteRecordingRequest('test-recording-id');

      const domainError = new Error('Recording not found');
      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockDeleteRecordingDomainService.deleteRecording.mockRejectedValue(domainError);

      await expect(deleteRecordingApplicationService.deleteRecording(callerId, request))
        .rejects.toThrow('Recording not found');

      expect(mockAuthorizationService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDeleteRecordingDomainService.deleteRecording).toHaveBeenCalledWith(request);
    });

    it('should handle different recording IDs', async () => {
      const callerId = 'test-caller-id';
      const request1 = new DeleteRecordingRequest('recording-1');
      const request2 = new DeleteRecordingRequest('recording-2');
      const expectedResponse = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'test-recording-id'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockDeleteRecordingDomainService.deleteRecording.mockResolvedValue(expectedResponse);

      await deleteRecordingApplicationService.deleteRecording(callerId, request1);
      await deleteRecordingApplicationService.deleteRecording(callerId, request2);

      expect(mockAuthorizationService.canAccessSuperAdmin).toHaveBeenCalledTimes(2);
      expect(mockDeleteRecordingDomainService.deleteRecording).toHaveBeenCalledWith(request1);
      expect(mockDeleteRecordingDomainService.deleteRecording).toHaveBeenCalledWith(request2);
    });
  });
});
