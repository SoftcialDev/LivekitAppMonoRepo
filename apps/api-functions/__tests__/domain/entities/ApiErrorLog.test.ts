import { ApiErrorLog } from '../../../src/domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
 
describe('ApiErrorLog', () => {
  const baseProps = {
    id: 'error-id',
    severity: ErrorSeverity.High,
    source: ErrorSource.Database,
    createdAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('isResolved', () => {
    it('should return true when resolved is true', () => {
      const errorLog = new ApiErrorLog({
        ...baseProps,
        resolved: true,
      });

      expect(errorLog.isResolved()).toBe(true);
    });

    it('should return false when resolved is false', () => {
      const errorLog = new ApiErrorLog({
        ...baseProps,
        resolved: false,
      });

      expect(errorLog.isResolved()).toBe(false);
    });
  });

  describe('isCritical', () => {
    it('should return true when severity is Critical', () => {
      const errorLog = new ApiErrorLog({
        ...baseProps,
        severity: ErrorSeverity.Critical,
      });

      expect(errorLog.isCritical()).toBe(true);
    });

    it('should return false when severity is not Critical', () => {
      const errorLog = new ApiErrorLog({
        ...baseProps,
        severity: ErrorSeverity.High,
      });

      expect(errorLog.isCritical()).toBe(false);
    });
  });

  describe('isHighSeverity', () => {
    it('should return true when severity is High', () => {
      const errorLog = new ApiErrorLog({
        ...baseProps,
        severity: ErrorSeverity.High,
      });

      expect(errorLog.isHighSeverity()).toBe(true);
    });

    it('should return true when severity is Critical', () => {
      const errorLog = new ApiErrorLog({
        ...baseProps,
        severity: ErrorSeverity.Critical,
      });

      expect(errorLog.isHighSeverity()).toBe(true);
    });

    it('should return false when severity is Medium or Low', () => {
      const errorLog = new ApiErrorLog({
        ...baseProps,
        severity: ErrorSeverity.Medium,
      });

      expect(errorLog.isHighSeverity()).toBe(false);
    });
  });

  describe('getAge', () => {
    it('should return age in milliseconds', () => {
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const errorLog = new ApiErrorLog({
        ...baseProps,
        createdAt,
      });

      const age = errorLog.getAge();
      expect(age).toBeGreaterThan(0);
      expect(typeof age).toBe('number');
    });
  });

  describe('getAgeInMinutes', () => {
    it('should return age in minutes', () => {
      const createdAt = new Date(Date.now() - 120000); // 2 minutes ago
      const errorLog = new ApiErrorLog({
        ...baseProps,
        createdAt,
      });

      const ageInMinutes = errorLog.getAgeInMinutes();
      expect(ageInMinutes).toBeGreaterThanOrEqual(1);
      expect(ageInMinutes).toBeLessThanOrEqual(3); // Allow some variance
    });
  });

  describe('isRecent', () => {
    it('should return true when error is recent', () => {
      const createdAt = new Date(Date.now() - 30000); // 30 seconds ago
      const errorLog = new ApiErrorLog({
        ...baseProps,
        createdAt,
      });

      expect(errorLog.isRecent(60)).toBe(true);
    });

    it('should return false when error is old', () => {
      const createdAt = new Date(Date.now() - 7200000); // 2 hours ago
      const errorLog = new ApiErrorLog({
        ...baseProps,
        createdAt,
      });

      expect(errorLog.isRecent(60)).toBe(false);
    });

    it('should use custom maxMinutes parameter', () => {
      const createdAt = new Date(Date.now() - 1800000); // 30 minutes ago
      const errorLog = new ApiErrorLog({
        ...baseProps,
        createdAt,
      });

      expect(errorLog.isRecent(60)).toBe(true);
      expect(errorLog.isRecent(20)).toBe(false);
    });
  });
});


