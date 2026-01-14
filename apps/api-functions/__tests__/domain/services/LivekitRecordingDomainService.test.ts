import { LivekitRecordingDomainService } from '../../../src/domain/services/LivekitRecordingDomainService';
import { RecordingSessionApplicationService } from '../../../src/application/services/RecordingSessionApplicationService';
import { RecordingCommand } from '../../../src/domain/entities/RecordingCommand';
import { RecordingStartError, RecordingStopError, NoActiveRecordingsError, RecordingCommandError } from '../../../src/domain/errors/RecordingErrors';
import { createMockRecordingSessionApplicationService } from './domainServiceTestSetup';
import { RecordingCommandType } from '@prisma/client';
import { RecordingStopStatus } from '../../../src/domain/enums/RecordingStopStatus';

describe('LivekitRecordingDomainService', () => {
  let service: LivekitRecordingDomainService;
  let mockApplicationService: jest.Mocked<RecordingSessionApplicationService>;

  beforeEach(() => {
    mockApplicationService = createMockRecordingSessionApplicationService();
    service = new LivekitRecordingDomainService(mockApplicationService);
  });

  describe('startRecording', () => {
    it('should start recording successfully', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.START,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );

      mockApplicationService.startRecordingSession.mockResolvedValue({
        roomName: 'room-name',
        egressId: 'egress-id',
        blobPath: 'recordings/path.mp4',
      });

      const result = await service.startRecording(command);

      expect(mockApplicationService.startRecordingSession).toHaveBeenCalledWith({
        roomName: 'room-name',
        subjectLabel: 'subject-id',
        initiatorUserId: 'initiator-id',
        subjectUserId: 'subject-id',
      });
      expect(result.egressId).toBe('egress-id');
      expect(result.blobPath).toBe('recordings/path.mp4');
    });

    it('should throw error when command is not START', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.STOP,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );

      await expect(service.startRecording(command)).rejects.toThrow(RecordingStartError);
    });

    it('should throw RecordingStartError when application service fails', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.START,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );

      mockApplicationService.startRecordingSession.mockRejectedValue(new Error('Egress failed'));

      await expect(service.startRecording(command)).rejects.toThrow(RecordingStartError);
    });
  });

  describe('stopRecording', () => {
    it('should stop recording successfully', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.STOP,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );

      mockApplicationService.stopAllRecordingsForUser.mockResolvedValue({
        message: 'Recordings stopped',
        total: 1,
        completed: 1,
        results: [
          {
            sessionId: 'session-1',
            egressId: 'egress-1',
            status: RecordingStopStatus.Completed,
            blobPath: 'recordings/path.mp4',
            blobUrl: 'https://storage.example.com/path.mp4',
            sasUrl: 'https://storage.example.com/path.mp4?sas=token',
            roomName: 'room-name',
            initiatorUserId: 'initiator-id',
            subjectUserId: 'subject-id',
          },
        ],
      });

      const result = await service.stopRecording(command);

      expect(mockApplicationService.stopAllRecordingsForUser).toHaveBeenCalledWith('subject-id', 60);
      expect(result.results).toHaveLength(1);
      expect(result.results?.[0].sessionId).toBe('session-1');
    });

    it('should throw error when command is not STOP', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.START,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );

      await expect(service.stopRecording(command)).rejects.toThrow(RecordingStopError);
    });

    it('should throw NoActiveRecordingsError when no recordings found', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.STOP,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );

      mockApplicationService.stopAllRecordingsForUser.mockResolvedValue({
        message: 'No recordings found',
        total: 0,
        completed: 0,
        results: [],
      });

      await expect(service.stopRecording(command)).rejects.toThrow(NoActiveRecordingsError);
    });

    it('should throw RecordingStopError when application service fails', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.STOP,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );

      mockApplicationService.stopAllRecordingsForUser.mockRejectedValue(new Error('Stop failed'));

      await expect(service.stopRecording(command)).rejects.toThrow(RecordingStopError);
    });

    it('should use roomName when subjectUserId is not provided', async () => {
      const command = RecordingCommand.create(
        RecordingCommandType.STOP,
        'room-name',
        'initiator-id',
        '',
        'Subject Label'
      );

      mockApplicationService.stopAllRecordingsForUser.mockResolvedValue({
        message: 'Recordings stopped',
        total: 1,
        completed: 1,
        results: [
          {
            sessionId: 'session-1',
            egressId: 'egress-1',
            status: RecordingStopStatus.Completed,
            roomName: 'room-name',
            initiatorUserId: 'initiator-id',
            subjectUserId: null,
          },
        ],
      });

      await service.stopRecording(command);

      expect(mockApplicationService.stopAllRecordingsForUser).toHaveBeenCalledWith('room-name', 60);
    });
  });
});

