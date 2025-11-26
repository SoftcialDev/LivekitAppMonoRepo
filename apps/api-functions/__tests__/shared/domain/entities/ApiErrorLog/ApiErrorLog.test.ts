/**
 * @fileoverview Tests for ApiErrorLog entity
 * @description Tests for API error log domain entity
 */

import { ApiErrorLog } from '../../../../../shared/domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../../../../shared/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../../../shared/domain/enums/ErrorSource';

describe('ApiErrorLog', () => {
  const mockDate = new Date('2023-01-01T10:00:00Z');
  const mockResolvedDate = new Date('2023-01-02T10:00:00Z');

  describe('constructor', () => {
    it('should create ApiErrorLog instance with all properties', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-123',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        endpoint: '/api/snapshots',
        functionName: 'notifySnapshotReport',
        errorName: 'GraphAPIError',
        errorMessage: 'Failed to send message',
        stackTrace: 'Error: Failed to send message\n    at ChatService.sendMessage',
        httpStatusCode: 500,
        userId: 'user-123',
        requestId: 'req-123',
        context: { chatId: 'chat-123', psoEmail: 'pso@example.com' },
        resolved: false,
        createdAt: mockDate
      });

      expect(errorLog).toBeInstanceOf(ApiErrorLog);
      expect(errorLog.id).toBe('error-123');
      expect(errorLog.severity).toBe(ErrorSeverity.High);
      expect(errorLog.source).toBe(ErrorSource.ChatService);
      expect(errorLog.endpoint).toBe('/api/snapshots');
      expect(errorLog.functionName).toBe('notifySnapshotReport');
      expect(errorLog.errorName).toBe('GraphAPIError');
      expect(errorLog.errorMessage).toBe('Failed to send message');
      expect(errorLog.stackTrace).toBe('Error: Failed to send message\n    at ChatService.sendMessage');
      expect(errorLog.httpStatusCode).toBe(500);
      expect(errorLog.userId).toBe('user-123');
      expect(errorLog.requestId).toBe('req-123');
      expect(errorLog.context).toEqual({ chatId: 'chat-123', psoEmail: 'pso@example.com' });
      expect(errorLog.resolved).toBe(false);
      expect(errorLog.createdAt).toEqual(mockDate);
    });

    it('should create ApiErrorLog instance with optional properties', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-456',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.Database,
        errorName: 'DatabaseError',
        errorMessage: 'Connection timeout',
        resolved: true,
        resolvedAt: mockResolvedDate,
        resolvedBy: 'admin-123',
        createdAt: mockDate
      });

      expect(errorLog.id).toBe('error-456');
      expect(errorLog.endpoint).toBeUndefined();
      expect(errorLog.functionName).toBeUndefined();
      expect(errorLog.stackTrace).toBeUndefined();
      expect(errorLog.httpStatusCode).toBeUndefined();
      expect(errorLog.userId).toBeUndefined();
      expect(errorLog.requestId).toBeUndefined();
      expect(errorLog.context).toBeUndefined();
      expect(errorLog.resolved).toBe(true);
      expect(errorLog.resolvedAt).toEqual(mockResolvedDate);
      expect(errorLog.resolvedBy).toBe('admin-123');
    });
  });

  describe('fromPrisma', () => {
    it('should create ApiErrorLog from Prisma model', () => {
      const prismaErrorLog = {
        id: 'error-789',
        severity: ErrorSeverity.Critical,
        source: ErrorSource.Authentication,
        endpoint: '/api/auth',
        functionName: 'authenticate',
        errorName: 'AuthError',
        errorMessage: 'Invalid token',
        stackTrace: 'Error: Invalid token',
        httpStatusCode: 401,
        userId: 'user-456',
        requestId: 'req-456',
        context: { token: 'invalid' },
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: mockDate
      };

      const errorLog = ApiErrorLog.fromPrisma(prismaErrorLog);

      expect(errorLog).toBeInstanceOf(ApiErrorLog);
      expect(errorLog.id).toBe('error-789');
      expect(errorLog.severity).toBe(ErrorSeverity.Critical);
      expect(errorLog.source).toBe(ErrorSource.Authentication);
      expect(errorLog.resolved).toBe(false);
      expect(errorLog.resolvedAt).toBeNull();
      expect(errorLog.resolvedBy).toBeNull();
    });

    it('should handle null optional fields from Prisma', () => {
      const prismaErrorLog = {
        id: 'error-999',
        severity: ErrorSeverity.Low,
        source: ErrorSource.Unknown,
        endpoint: null,
        functionName: null,
        errorName: 'UnknownError',
        errorMessage: 'Unknown error occurred',
        stackTrace: null,
        httpStatusCode: null,
        userId: null,
        requestId: null,
        context: null,
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: mockDate
      };

      const errorLog = ApiErrorLog.fromPrisma(prismaErrorLog);

      expect(errorLog.endpoint).toBeNull();
      expect(errorLog.functionName).toBeNull();
      expect(errorLog.stackTrace).toBeNull();
      expect(errorLog.httpStatusCode).toBeNull();
      expect(errorLog.userId).toBeNull();
      expect(errorLog.requestId).toBeNull();
      expect(errorLog.context).toBeNull();
    });
  });

  describe('isResolved', () => {
    it('should return true when error log is resolved', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-111',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: true,
        resolvedAt: mockResolvedDate,
        resolvedBy: 'admin-123',
        createdAt: mockDate
      });

      expect(errorLog.isResolved()).toBe(true);
    });

    it('should return false when error log is not resolved', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-112',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      expect(errorLog.isResolved()).toBe(false);
    });
  });

  describe('isCritical', () => {
    it('should return true when severity is Critical', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-113',
        severity: ErrorSeverity.Critical,
        source: ErrorSource.Database,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      expect(errorLog.isCritical()).toBe(true);
    });

    it('should return false when severity is not Critical', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-114',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      expect(errorLog.isCritical()).toBe(false);
    });
  });

  describe('isHighSeverity', () => {
    it('should return true when severity is High', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-115',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      expect(errorLog.isHighSeverity()).toBe(true);
    });

    it('should return true when severity is Critical', () => {
      const errorLog = new ApiErrorLog({
        id: 'error-116',
        severity: ErrorSeverity.Critical,
        source: ErrorSource.Database,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      expect(errorLog.isHighSeverity()).toBe(true);
    });

    it('should return false when severity is Low or Medium', () => {
      const lowErrorLog = new ApiErrorLog({
        id: 'error-117',
        severity: ErrorSeverity.Low,
        source: ErrorSource.Validation,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      const mediumErrorLog = new ApiErrorLog({
        id: 'error-118',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.Validation,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: mockDate
      });

      expect(lowErrorLog.isHighSeverity()).toBe(false);
      expect(mediumErrorLog.isHighSeverity()).toBe(false);
    });
  });

  describe('getAge', () => {
    it('should return age in milliseconds', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 60000); // 1 minute ago
      const errorLog = new ApiErrorLog({
        id: 'error-119',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: pastDate
      });

      const age = errorLog.getAge();
      expect(age).toBeGreaterThanOrEqual(60000);
      expect(age).toBeLessThan(70000); // Allow some margin
    });
  });

  describe('getAgeInMinutes', () => {
    it('should return age in minutes', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 120000); // 2 minutes ago
      const errorLog = new ApiErrorLog({
        id: 'error-120',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: pastDate
      });

      const ageInMinutes = errorLog.getAgeInMinutes();
      expect(ageInMinutes).toBeGreaterThanOrEqual(2);
      expect(ageInMinutes).toBeLessThan(3);
    });
  });

  describe('isRecent', () => {
    it('should return true when error log is within max minutes', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30000); // 30 seconds ago
      const errorLog = new ApiErrorLog({
        id: 'error-121',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: recentDate
      });

      expect(errorLog.isRecent(60)).toBe(true);
    });

    it('should return false when error log is older than max minutes', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 120000); // 2 minutes ago
      const errorLog = new ApiErrorLog({
        id: 'error-122',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: oldDate
      });

      expect(errorLog.isRecent(1)).toBe(false);
    });

    it('should use default 60 minutes when not specified', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30000); // 30 seconds ago
      const errorLog = new ApiErrorLog({
        id: 'error-123',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: recentDate
      });

      expect(errorLog.isRecent()).toBe(true);
    });
  });
});

