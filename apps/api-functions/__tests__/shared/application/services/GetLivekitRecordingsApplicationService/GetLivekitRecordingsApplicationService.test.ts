/**
 * @fileoverview GetLivekitRecordingsApplicationService - unit tests
 * @summary Tests for GetLivekitRecordingsApplicationService functionality
 * @description Validates recording operations, authorization, and business logic
 */

import { GetLivekitRecordingsApplicationService } from '../../../../../shared/application/services/GetLivekitRecordingsApplicationService';
import { IRecordingDomainService } from '../../../../../shared/domain/interfaces/IRecordingDomainService';
import { AuthorizationService } from '../../../../../shared/domain/services/AuthorizationService';
import { GetLivekitRecordingsRequest } from '../../../../../shared/domain/value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsResponse } from '../../../../../shared/domain/value-objects/GetLivekitRecordingsResponse';
import { RecordingAccessDeniedError } from '../../../../../shared/domain/errors/RecordingErrors';

// Mock dependencies
const mockRecordingDomainService: jest.Mocked<IRecordingDomainService> = {
  listRecordings: jest.fn()
};

const mockAuthorizationService: jest.Mocked<AuthorizationService> = {
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

describe('GetLivekitRecordingsApplicationService', () => {
  let service: GetLivekitRecordingsApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GetLivekitRecordingsApplicationService(
      mockRecordingDomainService,
      mockAuthorizationService
    );
  });

  describe('constructor', () => {
    it('should create service with dependencies', () => {
      expect(service).toBeInstanceOf(GetLivekitRecordingsApplicationService);
    });
  });

  describe('getLivekitRecordings', () => {
    it('should return recordings when user is authorized', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'test-room',
        10,
        'desc',
        true,
        60
      );

      const expectedResponse = new GetLivekitRecordingsResponse([
        {
          id: 'recording-1',
          roomName: 'test-room',
          roomId: 'room-123',
          egressId: 'egress-123',
          userId: 'user-123',
          status: 'completed',
          startedAt: '2023-01-01T10:00:00Z',
          stoppedAt: '2023-01-01T11:00:00Z',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z',
          username: 'Test User',
          recordedBy: 'admin-123',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://example.com/recording1.mp4',
          playbackUrl: 'https://example.com/playback1',
          duration: 3600
        }
      ], 1);

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);
      mockRecordingDomainService.listRecordings.mockResolvedValue(expectedResponse);

      const result = await service.getLivekitRecordings(callerId, request);

      expect(mockAuthorizationService.canAccessAdmin).toHaveBeenCalledWith(callerId);
      expect(mockRecordingDomainService.listRecordings).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw RecordingAccessDeniedError when user is not authorized', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'test-room',
        10,
        'desc',
        true,
        60
      );

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(false);

      await expect(service.getLivekitRecordings(callerId, request)).rejects.toThrow(RecordingAccessDeniedError);
      await expect(service.getLivekitRecordings(callerId, request)).rejects.toThrow('Insufficient privileges to access recordings');

      expect(mockAuthorizationService.canAccessAdmin).toHaveBeenCalledWith(callerId);
      expect(mockRecordingDomainService.listRecordings).not.toHaveBeenCalled();
    });

    it('should handle authorization service errors', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'test-room',
        10,
        'desc',
        true,
        60
      );

      mockAuthorizationService.canAccessAdmin.mockRejectedValue(new Error('Authorization service error'));

      await expect(service.getLivekitRecordings(callerId, request)).rejects.toThrow('Authorization service error');
    });

    it('should handle domain service errors', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'test-room',
        10,
        'desc',
        true,
        60
      );

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);
      mockRecordingDomainService.listRecordings.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getLivekitRecordings(callerId, request)).rejects.toThrow('Database connection failed');
    });

    it('should handle request with minimal parameters', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        undefined,
        50,
        'asc',
        false,
        30
      );

      const expectedResponse = new GetLivekitRecordingsResponse([], 0);

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);
      mockRecordingDomainService.listRecordings.mockResolvedValue(expectedResponse);

      const result = await service.getLivekitRecordings(callerId, request);

      expect(mockAuthorizationService.canAccessAdmin).toHaveBeenCalledWith(callerId);
      expect(mockRecordingDomainService.listRecordings).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should handle request with all parameters', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'specific-room',
        100,
        'desc',
        true,
        120
      );

      const expectedResponse = new GetLivekitRecordingsResponse([
        {
          id: 'recording-1',
          roomName: 'specific-room',
          roomId: 'room-123',
          egressId: 'egress-123',
          userId: 'user-123',
          status: 'completed',
          startedAt: '2023-01-01T10:00:00Z',
          stoppedAt: '2023-01-01T11:00:00Z',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z',
          username: 'Test User 1',
          recordedBy: 'admin-123',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://example.com/recording1.mp4',
          playbackUrl: 'https://example.com/playback1',
          duration: 3600
        },
        {
          id: 'recording-2',
          roomName: 'specific-room',
          roomId: 'room-456',
          egressId: 'egress-456',
          userId: 'user-456',
          status: 'completed',
          startedAt: '2023-01-01T12:00:00Z',
          stoppedAt: '2023-01-01T13:00:00Z',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T13:00:00Z',
          username: 'Test User 2',
          recordedBy: 'admin-123',
          blobPath: '/recordings/recording-2.mp4',
          blobUrl: 'https://example.com/recording2.mp4',
          playbackUrl: 'https://example.com/playback2',
          duration: 3600
        }
      ], 2);

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);
      mockRecordingDomainService.listRecordings.mockResolvedValue(expectedResponse);

      const result = await service.getLivekitRecordings(callerId, request);

      expect(mockAuthorizationService.canAccessAdmin).toHaveBeenCalledWith(callerId);
      expect(mockRecordingDomainService.listRecordings).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('error handling', () => {
    it('should propagate domain service errors', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'test-room',
        10,
        'desc',
        true,
        60
      );

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);
      mockRecordingDomainService.listRecordings.mockRejectedValue(new Error('Recording service unavailable'));

      await expect(service.getLivekitRecordings(callerId, request)).rejects.toThrow('Recording service unavailable');
    });

    it('should handle authorization timeout', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'test-room',
        10,
        'desc',
        true,
        60
      );

      mockAuthorizationService.canAccessAdmin.mockRejectedValue(new Error('Authorization timeout'));

      await expect(service.getLivekitRecordings(callerId, request)).rejects.toThrow('Authorization timeout');
    });
  });

  describe('edge cases', () => {
    it('should handle empty recordings response', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'empty-room',
        10,
        'desc',
        true,
        60
      );

      const expectedResponse = new GetLivekitRecordingsResponse([], 0);

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);
      mockRecordingDomainService.listRecordings.mockResolvedValue(expectedResponse);

      const result = await service.getLivekitRecordings(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.items).toHaveLength(0);
    });

    it('should handle large recordings response', async () => {
      const callerId = 'user-123';
      const request = new GetLivekitRecordingsRequest(
        'busy-room',
        1000,
        'desc',
        true,
        60
      );

      const recordings = Array.from({ length: 100 }, (_, i) => ({
        id: `recording-${i}`,
        roomName: 'busy-room',
        roomId: `room-${i}`,
        egressId: `egress-${i}`,
        userId: `user-${i}`,
        status: 'completed',
        startedAt: `2023-01-01T${10 + (i % 24)}:00:00Z`,
        stoppedAt: `2023-01-01T${11 + (i % 24)}:00:00Z`,
        createdAt: `2023-01-01T${10 + (i % 24)}:00:00Z`,
        updatedAt: `2023-01-01T${11 + (i % 24)}:00:00Z`,
        username: `User ${i}`,
        recordedBy: 'admin-123',
        blobPath: `/recordings/recording-${i}.mp4`,
        blobUrl: `https://example.com/recording${i}.mp4`,
        playbackUrl: `https://example.com/playback${i}`,
        duration: 3600
      }));

      const expectedResponse = new GetLivekitRecordingsResponse(recordings, 100);

      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);
      mockRecordingDomainService.listRecordings.mockResolvedValue(expectedResponse);

      const result = await service.getLivekitRecordings(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.items).toHaveLength(100);
    });
  });
});
