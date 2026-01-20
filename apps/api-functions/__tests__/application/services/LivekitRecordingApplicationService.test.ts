import { LivekitRecordingApplicationService } from '../../../src/application/services/LivekitRecordingApplicationService';
import { ILivekitRecordingDomainService } from '../../../src/domain/interfaces';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { LivekitRecordingRequest } from '../../../src/domain/value-objects/LivekitRecordingRequest';
import { LivekitRecordingResponse } from '../../../src/domain/value-objects/LivekitRecordingResponse';
import { RecordingUserNotFoundError } from '../../../src/domain/errors/RecordingErrors';
import { RecordingCommandType } from '@prisma/client';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('LivekitRecordingApplicationService', () => {
  let service: LivekitRecordingApplicationService;
  let mockRecordingDomainService: jest.Mocked<ILivekitRecordingDomainService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockRecordingDomainService = {
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockAuthorizationService = {
      canAccessSuperAdmin: jest.fn(),
    } as any;

    service = new LivekitRecordingApplicationService(
      mockRecordingDomainService,
      mockUserRepository,
      mockAuthorizationService
    );
  });

  describe('processRecordingCommand', () => {
    const callerId = 'test-caller-id';
    const roomName = 'room-123';
    const callerUser = new User({
      id: 'caller-id',
      azureAdObjectId: callerId,
      email: 'caller@example.com',
      fullName: 'Caller User',
      role: UserRole.SuperAdmin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should successfully process START recording command with subject user found', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomName);
      const subjectUser = new User({
        id: roomName,
        azureAdObjectId: 'subject-id',
        email: 'subject@example.com',
        fullName: 'Subject User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResponse = new LivekitRecordingResponse(
        'Recording started',
        roomName,
        'egress-id',
        'blob-path'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(callerUser);
      mockUserRepository.findById.mockResolvedValue(subjectUser);
      mockRecordingDomainService.startRecording.mockResolvedValue(mockResponse);

      const result = await service.processRecordingCommand(callerId, request);

      expect(mockAuthorizationService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(roomName);
      expect(mockRecordingDomainService.startRecording).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should successfully process START recording command with fallback to caller', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomName);
      const mockResponse = new LivekitRecordingResponse(
        'Recording started',
        roomName,
        'egress-id',
        'blob-path'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(callerUser);
      mockUserRepository.findById.mockResolvedValue(null);
      mockRecordingDomainService.startRecording.mockResolvedValue(mockResponse);

      const result = await service.processRecordingCommand(callerId, request);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(roomName);
      expect(mockRecordingDomainService.startRecording).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should successfully process STOP recording command', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.STOP, roomName);
      const subjectUser = new User({
        id: roomName,
        azureAdObjectId: 'subject-id',
        email: 'subject@example.com',
        fullName: 'Subject User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResponse = new LivekitRecordingResponse(
        'Recording stopped',
        roomName,
        undefined,
        undefined,
        []
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(callerUser);
      mockUserRepository.findById.mockResolvedValue(subjectUser);
      mockRecordingDomainService.stopRecording.mockResolvedValue(mockResponse);

      const result = await service.processRecordingCommand(callerId, request);

      expect(mockRecordingDomainService.stopRecording).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should throw error when caller not found', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomName);

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.processRecordingCommand(callerId, request)).rejects.toThrow(
        RecordingUserNotFoundError
      );
    });

    it('should use fallback user when subject resolution throws error', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomName);
      const mockResponse = new LivekitRecordingResponse(
        'Recording started',
        roomName,
        'egress-id',
        'blob-path'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(callerUser);
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));
      mockRecordingDomainService.startRecording.mockResolvedValue(mockResponse);

      const result = await service.processRecordingCommand(callerId, request);

      expect(mockRecordingDomainService.startRecording).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should use subject user fullName when available', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomName);
      const subjectUser = new User({
        id: roomName,
        azureAdObjectId: 'subject-id',
        email: 'subject@example.com',
        fullName: 'Subject Full Name',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResponse = new LivekitRecordingResponse(
        'Recording started',
        roomName,
        'egress-id',
        'blob-path'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(callerUser);
      mockUserRepository.findById.mockResolvedValue(subjectUser);
      mockRecordingDomainService.startRecording.mockResolvedValue(mockResponse);

      await service.processRecordingCommand(callerId, request);

      const commandCall = mockRecordingDomainService.startRecording.mock.calls[0][0];
      expect(commandCall.subjectLabel).toBe('Subject Full Name');
    });

    it('should use subject user email when fullName not available', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomName);
      const subjectUser = new User({
        id: roomName,
        azureAdObjectId: 'subject-id',
        email: 'subject@example.com',
        fullName: '',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResponse = new LivekitRecordingResponse(
        'Recording started',
        roomName,
        'egress-id',
        'blob-path'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(callerUser);
      mockUserRepository.findById.mockResolvedValue(subjectUser);
      mockRecordingDomainService.startRecording.mockResolvedValue(mockResponse);

      await service.processRecordingCommand(callerId, request);

      const commandCall = mockRecordingDomainService.startRecording.mock.calls[0][0];
      expect(commandCall.subjectLabel).toBe('subject@example.com');
    });

    it('should use subject user id when fullName and email not available', async () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomName);
      const subjectUser = new User({
        id: roomName,
        azureAdObjectId: 'subject-id',
        email: '',
        fullName: '',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResponse = new LivekitRecordingResponse(
        'Recording started',
        roomName,
        'egress-id',
        'blob-path'
      );

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(callerUser);
      mockUserRepository.findById.mockResolvedValue(subjectUser);
      mockRecordingDomainService.startRecording.mockResolvedValue(mockResponse);

      await service.processRecordingCommand(callerId, request);

      const commandCall = mockRecordingDomainService.startRecording.mock.calls[0][0];
      expect(commandCall.subjectLabel).toBe(roomName);
    });
  });
});






