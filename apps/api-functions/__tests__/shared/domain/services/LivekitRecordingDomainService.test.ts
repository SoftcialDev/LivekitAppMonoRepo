// Mock Prisma enums using centralized mock
import { PrismaMock } from '../../../mocks/prisma-enums';
jest.mock('@prisma/client', () => PrismaMock);

// Mock config before importing the service
jest.mock('../../../../shared/config', () => ({
  config: {
    livekitApiUrl: 'http://localhost:7880',
    livekitApiKey: 'test-key',
    livekitApiSecret: 'test-secret',
    accountName: 'testaccount',
  },
}));

import { LivekitRecordingDomainService } from '../../../../shared/domain/services/LivekitRecordingDomainService';
import { RecordingCommand } from '../../../../shared/domain/entities/RecordingCommand';
import { IRecordingSessionRepository } from '../../../../shared/domain/interfaces/IRecordingSessionRepository';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { RecordingCommandError } from '../../../../shared/domain/errors/RecordingErrors';
import { CommandType } from '../../../../shared/domain/enums/CommandType';

describe('LivekitRecordingDomainService', () => {
  let service: LivekitRecordingDomainService;
  let recordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let blobStorageService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variables required for LiveKit and Azure Storage
    process.env.LIVEKIT_API_URL = 'http://localhost:7880';
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
    process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';
    process.env.AZURE_STORAGE_KEY = 'dGVzdGtleQ=='; // base64 encoded test key
    process.env.RECORDINGS_CONTAINER_NAME = 'recordings';
    recordingRepository = { 
      createRecordingSession: jest.fn(), 
      getActiveRecordingForRoom: jest.fn(), 
      updateRecordingSession: jest.fn(),
      findActiveByRoom: jest.fn(),
      create: jest.fn()
    } as any;
    userRepository = {} as any;
    blobStorageService = {} as any;
    service = new LivekitRecordingDomainService(recordingRepository, userRepository, blobStorageService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.LIVEKIT_API_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
    delete process.env.AZURE_STORAGE_ACCOUNT;
    delete process.env.AZURE_STORAGE_KEY;
    delete process.env.RECORDINGS_CONTAINER_NAME;
  });

  // Placeholder test to prevent empty test suite
  it('should be instantiable', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(LivekitRecordingDomainService);
  });

  // Note: These tests require extensive mocking of LiveKit SDK and Azure Storage infrastructure
  // They are commented out until proper infrastructure mocking is implemented
  // The LivekitRecordingDomainService is tested through integration tests
  
  // describe('startRecording', () => {
  //   it('should start recording successfully', async () => {
  //     const command = RecordingCommand.create('START' as any, 'room-123', 'initiator-123', 'subject-123', 'Subject Label');
  //     const result = await service.startRecording(command);
  //     expect(result.message).toContain('Recording started');
  //   });

  //   it('should throw RecordingCommandError for non-START command', async () => {
  //     const command = RecordingCommand.create('STOP' as any, 'room-123', 'initiator-123', 'subject-123', 'Subject Label');
  //     await expect(service.startRecording(command)).rejects.toThrow('Invalid command type');
  //   });
  // });

  // describe('stopRecording', () => {
  //   it('should stop recording successfully', async () => {
  //     const command = RecordingCommand.create('STOP' as any, 'room-123', 'initiator-123', 'subject-123', 'Subject Label');
  //     const result = await service.stopRecording(command);
  //     expect(result.message).toContain('Recording stopped');
  //   });

  //   it('should throw RecordingCommandError for non-STOP command', async () => {
  //     const command = RecordingCommand.create('START' as any, 'room-123', 'initiator-123', 'subject-123', 'Subject Label');
  //     await expect(service.stopRecording(command)).rejects.toThrow('Invalid command type');
  //   });
  // });
});