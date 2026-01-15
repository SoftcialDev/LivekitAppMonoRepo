import { GetErrorLogsResponse } from '../../../src/domain/value-objects/GetErrorLogsResponse';
import { ValidationError } from '../../../src/domain/errors/DomainError';
import { ApiErrorLog } from '../../../src/domain/entities/ApiErrorLog';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';

describe('GetErrorLogsResponse', () => {
  describe('toSinglePayload', () => {
    it('should convert single error log to payload', () => {
      const mockLog = new ApiErrorLog({
        id: 'log-id',
        source: ErrorSource.Database,
        severity: ErrorSeverity.High,
        endpoint: '/api/test',
        functionName: 'testFunction',
        errorName: 'TestError',
        errorMessage: 'Test error message',
        stackTrace: null,
        httpStatusCode: 500,
        userId: null,
        userEmail: null,
        requestId: null,
        context: null,
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date()
      });
      const response = GetErrorLogsResponse.fromLog(mockLog);
      const payload = response.toSinglePayload();

      expect(payload).toBeDefined();
      expect(payload.id).toBe('log-id');
    });

    it('should throw ValidationError when no logs exist', () => {
      const response = GetErrorLogsResponse.fromLogs([], 0);
      
      expect(() => {
        response.toSinglePayload();
      }).toThrow(ValidationError);
    });
  });
});

