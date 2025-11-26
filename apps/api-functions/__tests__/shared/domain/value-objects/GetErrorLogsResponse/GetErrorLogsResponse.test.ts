/**
 * @fileoverview Tests for GetErrorLogsResponse
 * @description Tests for error log query response value object
 */

import { GetErrorLogsResponse } from '../../../../../shared/domain/value-objects/GetErrorLogsResponse';
import { ApiErrorLog } from '../../../../../shared/domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../../../../shared/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../../../shared/domain/enums/ErrorSource';

describe('GetErrorLogsResponse', () => {
  const mockDate = new Date('2023-01-01T10:00:00Z');

  describe('fromLogs', () => {
    it('should create response from array of error logs with total', () => {
      const logs = [
        new ApiErrorLog({
          id: 'error-123',
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          errorName: 'Error',
          errorMessage: 'Test error 1',
          resolved: false,
          createdAt: mockDate
        }),
        new ApiErrorLog({
          id: 'error-456',
          severity: ErrorSeverity.Medium,
          source: ErrorSource.Database,
          errorName: 'Error',
          errorMessage: 'Test error 2',
          resolved: false,
          createdAt: mockDate
        })
      ];

      const response = GetErrorLogsResponse.fromLogs(logs, 10, 100, 0);

      expect(response).toBeInstanceOf(GetErrorLogsResponse);
    });

    it('should create response from empty array', () => {
      const response = GetErrorLogsResponse.fromLogs([], 0);

      expect(response).toBeInstanceOf(GetErrorLogsResponse);
    });
  });

  describe('fromLog', () => {
    it('should create response from single error log', () => {
      const log = new ApiErrorLog({
        id: 'error-123',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      const response = GetErrorLogsResponse.fromLog(log);

      expect(response).toBeInstanceOf(GetErrorLogsResponse);
    });
  });

  describe('toPayload', () => {
    it('should convert logs to payload format with pagination', () => {
      const logs = [
        new ApiErrorLog({
          id: 'error-123',
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          endpoint: '/api/snapshots',
          functionName: 'notifySnapshotReport',
          errorName: 'GraphAPIError',
          errorMessage: 'Failed to send message',
          stackTrace: 'Error: Failed to send message',
          httpStatusCode: 500,
          userId: 'user-123',
          requestId: 'req-123',
          context: { chatId: 'chat-123' },
          resolved: false,
          createdAt: mockDate
        })
      ];

      const response = GetErrorLogsResponse.fromLogs(logs, 50, 100, 0);
      const payload = response.toPayload();

      expect(payload.count).toBe(1);
      expect(payload.total).toBe(50);
      expect(payload.limit).toBe(100);
      expect(payload.offset).toBe(0);
      expect(payload.hasMore).toBe(true);
      expect(payload.logs).toHaveLength(1);
      expect(payload.logs[0].id).toBe('error-123');
      expect(payload.logs[0].severity).toBe(ErrorSeverity.High);
      expect(payload.logs[0].source).toBe(ErrorSource.ChatService);
      expect(payload.logs[0].endpoint).toBe('/api/snapshots');
      expect(payload.logs[0].functionName).toBe('notifySnapshotReport');
      expect(payload.logs[0].errorName).toBe('GraphAPIError');
      expect(payload.logs[0].errorMessage).toBe('Failed to send message');
      expect(payload.logs[0].stackTrace).toBe('Error: Failed to send message');
      expect(payload.logs[0].httpStatusCode).toBe(500);
      expect(payload.logs[0].userId).toBe('user-123');
      expect(payload.logs[0].requestId).toBe('req-123');
      expect(payload.logs[0].context).toEqual({ chatId: 'chat-123' });
      expect(payload.logs[0].resolved).toBe(false);
      expect(payload.logs[0].createdAt).toEqual(mockDate);
    });

    it('should handle multiple logs with pagination', () => {
      const logs = [
        new ApiErrorLog({
          id: 'error-123',
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          errorName: 'Error',
          errorMessage: 'Test error 1',
          resolved: false,
          createdAt: mockDate
        }),
        new ApiErrorLog({
          id: 'error-456',
          severity: ErrorSeverity.Medium,
          source: ErrorSource.Database,
          errorName: 'Error',
          errorMessage: 'Test error 2',
          resolved: false,
          createdAt: mockDate
        })
      ];

      const response = GetErrorLogsResponse.fromLogs(logs, 10, 2, 0);
      const payload = response.toPayload();

      expect(payload.count).toBe(2);
      expect(payload.total).toBe(10);
      expect(payload.limit).toBe(2);
      expect(payload.offset).toBe(0);
      expect(payload.hasMore).toBe(true);
      expect(payload.logs).toHaveLength(2);
    });

    it('should handle empty logs array', () => {
      const response = GetErrorLogsResponse.fromLogs([], 0, undefined, undefined);
      const payload = response.toPayload();

      expect(payload.count).toBe(0);
      expect(payload.total).toBe(0);
      expect(payload.logs).toHaveLength(0);
      expect(payload.hasMore).toBe(false);
    });

    it('should correctly calculate hasMore when no more pages', () => {
      const logs = [
        new ApiErrorLog({
          id: 'error-123',
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          errorName: 'Error',
          errorMessage: 'Test error',
          resolved: false,
          createdAt: mockDate
        })
      ];

      // Total is 1, we have 1, offset is 0, limit is 100
      const response = GetErrorLogsResponse.fromLogs(logs, 1, 100, 0);
      const payload = response.toPayload();

      expect(payload.hasMore).toBe(false);
    });
  });

  describe('toSinglePayload', () => {
    it('should convert single log to payload', () => {
      const log = new ApiErrorLog({
        id: 'error-123',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      const response = GetErrorLogsResponse.fromLog(log);
      const payload = response.toSinglePayload();

      expect(payload.id).toBe('error-123');
      expect(payload.severity).toBe(ErrorSeverity.High);
      expect(payload.source).toBe(ErrorSource.ChatService);
    });

    it('should throw error when no logs', () => {
      const response = GetErrorLogsResponse.fromLogs([], 0, undefined, undefined);

      expect(() => response.toSinglePayload()).toThrow('No error log to convert');
    });
  });
});

