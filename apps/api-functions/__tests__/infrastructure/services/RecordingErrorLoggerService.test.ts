import { RecordingErrorLoggerService } from '../../../src/infrastructure/services/RecordingErrorLoggerService';
import { IErrorLogService } from '../../../src/domain/interfaces/IErrorLogService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { logRecordingError } from '../../../src/infrastructure/services/recordingErrorLogger';
import { RecordingErrorInfo, RecordingErrorContext } from '../../../src/domain/types/RecordingErrorTypes';

jest.mock('../../../src/infrastructure/services/recordingErrorLogger');

const mockLogRecordingError = logRecordingError as jest.MockedFunction<typeof logRecordingError>;

describe('RecordingErrorLoggerService', () => {
  let errorLogService: jest.Mocked<IErrorLogService>;
  let userRepository: jest.Mocked<IUserRepository>;
  let service: RecordingErrorLoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogRecordingError.mockResolvedValue(undefined);

    errorLogService = {} as any;
    userRepository = {} as any;
  });

  describe('constructor', () => {
    it('should create service with errorLogService and userRepository', () => {
      service = new RecordingErrorLoggerService(errorLogService, userRepository);
      expect(service).toBeInstanceOf(RecordingErrorLoggerService);
    });

    it('should create service with only errorLogService', () => {
      service = new RecordingErrorLoggerService(errorLogService);
      expect(service).toBeInstanceOf(RecordingErrorLoggerService);
    });

    it('should create service with no dependencies', () => {
      service = new RecordingErrorLoggerService();
      expect(service).toBeInstanceOf(RecordingErrorLoggerService);
    });
  });

  describe('logError', () => {
    it('should delegate to logRecordingError utility function', async () => {
      service = new RecordingErrorLoggerService(errorLogService, userRepository);
      
      const errorInfo: RecordingErrorInfo = {
        message: 'Recording failed',
        name: 'RecordingError',
        stack: 'Error stack trace',
      };

      const context: RecordingErrorContext = {
        userId: 'user-id',
        subjectUserId: 'subject-id',
        roomName: 'room-123',
        egressId: 'egress-id',
      };

      await service.logError(errorInfo, context);

      expect(mockLogRecordingError).toHaveBeenCalledWith(
        errorLogService,
        userRepository,
        errorInfo,
        context
      );
    });

    it('should pass undefined services when not provided', async () => {
      service = new RecordingErrorLoggerService();
      
      const errorInfo: RecordingErrorInfo = {
        message: 'Recording failed',
      };

      const context: RecordingErrorContext = {
        userId: 'user-id',
        roomName: 'room-123',
      };

      await service.logError(errorInfo, context);

      expect(mockLogRecordingError).toHaveBeenCalledWith(
        undefined,
        undefined,
        errorInfo,
        context
      );
    });

    it('should pass only errorLogService when userRepository is not provided', async () => {
      service = new RecordingErrorLoggerService(errorLogService);
      
      const errorInfo: RecordingErrorInfo = {
        message: 'Recording failed',
      };

      const context: RecordingErrorContext = {
        userId: 'user-id',
        roomName: 'room-123',
      };

      await service.logError(errorInfo, context);

      expect(mockLogRecordingError).toHaveBeenCalledWith(
        errorLogService,
        undefined,
        errorInfo,
        context
      );
    });

    it('should handle error info with all fields', async () => {
      service = new RecordingErrorLoggerService(errorLogService, userRepository);
      
      const errorInfo: RecordingErrorInfo = {
        message: 'Recording failed',
        name: 'RecordingError',
        stack: 'Error stack trace',
      };

      const context: RecordingErrorContext = {
        userId: 'user-id',
        subjectUserId: 'subject-id',
        roomName: 'room-123',
        egressId: 'egress-id',
        blobPath: '/path/to/blob',
      };

      await service.logError(errorInfo, context);

      expect(mockLogRecordingError).toHaveBeenCalledWith(
        errorLogService,
        userRepository,
        errorInfo,
        context
      );
    });

    it('should handle minimal error info', async () => {
      service = new RecordingErrorLoggerService(errorLogService, userRepository);
      
      const errorInfo: RecordingErrorInfo = {
        message: 'Recording failed',
      };

      const context: RecordingErrorContext = {
        userId: 'user-id',
        roomName: 'room-123',
      };

      await service.logError(errorInfo, context);

      expect(mockLogRecordingError).toHaveBeenCalledWith(
        errorLogService,
        userRepository,
        errorInfo,
        context
      );
    });
  });
});

