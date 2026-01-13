import { logRecordingError } from '../../../src/infrastructure/services/recordingErrorLogger';
import { IErrorLogService } from '../../../src/domain/interfaces/IErrorLogService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';
import { ApiEndpoints } from '../../../src/domain/constants/ApiEndpoints';
import { FunctionNames } from '../../../src/domain/constants/FunctionNames';
import { User } from '../../../src/domain/entities/User';

describe('recordingErrorLogger', () => {
  let errorLogService: jest.Mocked<IErrorLogService>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    errorLogService = {
      logError: jest.fn(),
    } as any;

    userRepository = {
      findById: jest.fn(),
    } as any;
  });

  describe('logRecordingError', () => {
    it('should log error with all context when errorLogService is provided', async () => {
      const error = {
        message: 'Recording failed',
        name: 'RecordingError',
        stack: 'Error stack trace',
      };

      const context = {
        sessionId: 'session-123',
        egressId: 'egress-123',
        roomName: 'room-123',
        subjectUserId: 'subject-id',
        initiatorUserId: 'initiator-id',
        egressStatus: 'EGRESS_FAILED',
        egressError: 'Egress error message',
      };

      await logRecordingError(errorLogService, userRepository, error, context);

      expect(errorLogService.logError).toHaveBeenCalledWith({
        source: ErrorSource.Recording,
        severity: ErrorSeverity.High,
        endpoint: ApiEndpoints.RECORDING,
        functionName: FunctionNames.LIVEKIT_RECORDING,
        error: expect.any(Error),
        userId: 'initiator-id',
        userEmail: undefined,
        context: {
          sessionId: 'session-123',
          egressId: 'egress-123',
          roomName: 'room-123',
          subjectUserId: 'subject-id',
          egressStatus: 'EGRESS_FAILED',
          egressError: 'Egress error message',
        },
      });
    });

    it('should return early when errorLogService is not provided', async () => {
      const error = { message: 'Recording failed' };
      const context = {};

      await logRecordingError(undefined, userRepository, error, context);

      expect(errorLogService.logError).not.toHaveBeenCalled();
    });

    it('should fetch subject user email when subjectUserId is provided', async () => {
      const subjectUser = new User({
        id: 'subject-id',
        azureAdObjectId: 'azure-id',
        email: 'subject@example.com',
        fullName: 'Subject User',
        role: 'PSO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findById.mockResolvedValue(subjectUser);

      const error = { message: 'Recording failed' };
      const context = {
        subjectUserId: 'subject-id',
        initiatorUserId: 'initiator-id',
      };

      await logRecordingError(errorLogService, userRepository, error, context);

      expect(userRepository.findById).toHaveBeenCalledWith('subject-id');
      expect(errorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'subject@example.com',
        })
      );
    });

    it('should handle missing subject user gracefully', async () => {
      userRepository.findById.mockResolvedValue(null);

      const error = { message: 'Recording failed' };
      const context = {
        subjectUserId: 'subject-id',
        initiatorUserId: 'initiator-id',
      };

      await logRecordingError(errorLogService, userRepository, error, context);

      expect(errorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: undefined,
        })
      );
    });

    it('should handle error when fetching subject user', async () => {
      userRepository.findById.mockRejectedValue(new Error('Database error'));

      const error = { message: 'Recording failed' };
      const context = {
        subjectUserId: 'subject-id',
        initiatorUserId: 'initiator-id',
      };

      await logRecordingError(errorLogService, userRepository, error, context);

      expect(errorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: undefined,
        })
      );
    });

    it('should handle all context fields', async () => {
      const error = { message: 'Recording failed' };
      const context = {
        sessionId: 'session-123',
        egressId: 'egress-123',
        roomName: 'room-123',
        subjectUserId: 'subject-id',
        initiatorUserId: 'initiator-id',
        egressStatus: 'EGRESS_FAILED',
        egressError: 'Egress error',
        clusterErrorDetails: { code: 500 },
        failureReason: 'Network timeout',
        credentialsSentToLiveKit: { accountName: 'test' },
        stopError: 'Stop failed',
      };

      await logRecordingError(errorLogService, userRepository, error, context);

      expect(errorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            sessionId: 'session-123',
            egressId: 'egress-123',
            roomName: 'room-123',
            subjectUserId: 'subject-id',
            egressStatus: 'EGRESS_FAILED',
            egressError: 'Egress error',
            clusterErrorDetails: { code: 500 },
            failureReason: 'Network timeout',
            credentialsSentToLiveKit: { accountName: 'test' },
            stopError: 'Stop failed',
          }),
        })
      );
    });

    it('should handle null context values', async () => {
      const error = { message: 'Recording failed' };
      const context = {
        sessionId: null,
        subjectUserId: null,
        initiatorUserId: 'initiator-id',
      };

      await logRecordingError(errorLogService, userRepository, error, context);

      expect(errorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            sessionId: undefined,
            subjectUserId: undefined,
          }),
        })
      );
    });

    it('should silently handle errors when logging fails', async () => {
      errorLogService.logError.mockRejectedValue(new Error('Logging failed'));

      const error = { message: 'Recording failed' };
      const context = { initiatorUserId: 'initiator-id' };

      await expect(
        logRecordingError(errorLogService, userRepository, error, context)
      ).resolves.not.toThrow();
    });
  });
});

