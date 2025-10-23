/**
 * @fileoverview LivekitRecordingApplicationService - unit tests
 */

import { LivekitRecordingApplicationService } from '../../../../../shared/application/services/LivekitRecordingApplicationService';
import { RecordingUserNotFoundError } from '../../../../../shared/domain/errors/RecordingErrors';

describe('LivekitRecordingApplicationService', () => {
  let service: LivekitRecordingApplicationService;
  let mockDomainService: any;
  let mockUserRepository: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockDomainService = {
      startRecording: jest.fn(),
      stopRecording: jest.fn()
    };
    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
      findById: jest.fn()
    };
    mockAuthService = {
      canAccessSuperAdmin: jest.fn()
    };
    service = new LivekitRecordingApplicationService(mockDomainService, mockUserRepository, mockAuthService);
  });

  describe('processRecordingCommand', () => {
    it('processes start recording command successfully', async () => {
      const callerId = 'caller123';
      const request = {
        command: 'START',
        roomName: 'room123',
        isStartCommand: jest.fn().mockReturnValue(true)
      } as any;
      const caller = { id: '1', fullName: 'Caller', email: 'caller@example.com' };
      const subject = { id: '2', fullName: 'Subject', email: 'subject@example.com' };
      const expectedResult = { success: true } as any;

      mockAuthService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findById.mockResolvedValue(subject);
      mockDomainService.startRecording.mockResolvedValue(expectedResult);

      const result = await service.processRecordingCommand(callerId, request);

      expect(mockAuthService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('room123');
      expect(mockDomainService.startRecording).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('processes stop recording command successfully', async () => {
      const callerId = 'caller123';
      const request = {
        command: 'STOP',
        roomName: 'room123',
        isStartCommand: jest.fn().mockReturnValue(false)
      } as any;
      const caller = { id: '1', fullName: 'Caller', email: 'caller@example.com' };
      const subject = { id: '2', fullName: 'Subject', email: 'subject@example.com' };
      const expectedResult = { success: true } as any;

      mockAuthService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findById.mockResolvedValue(subject);
      mockDomainService.stopRecording.mockResolvedValue(expectedResult);

      const result = await service.processRecordingCommand(callerId, request);

      expect(mockDomainService.stopRecording).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('throws error when caller not found', async () => {
      const callerId = 'caller123';
      const request = { command: 'START', roomName: 'room123', isStartCommand: jest.fn().mockReturnValue(true) } as any;

      mockAuthService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.processRecordingCommand(callerId, request))
        .rejects
        .toThrow(RecordingUserNotFoundError);
    });

    it('uses fallback user when subject resolution fails with error', async () => {
      const callerId = 'caller123';
      const request = {
        command: 'START',
        roomName: 'room123',
        isStartCommand: jest.fn().mockReturnValue(true)
      } as any;
      const caller = { id: '1', fullName: 'Caller', email: 'caller@example.com' };
      const expectedResult = { success: true } as any;

      mockAuthService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));
      mockDomainService.startRecording.mockResolvedValue(expectedResult);

      const result = await service.processRecordingCommand(callerId, request);

      expect(mockDomainService.startRecording).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });
});
