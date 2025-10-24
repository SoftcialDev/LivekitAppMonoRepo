/**
 * @fileoverview Tests for timezone utilities
 * @description Tests for Costa Rica timezone utilities
 */

import { CR_TZ, nowCRIso } from '../../../shared/utils/timezone';
import dayjs from 'dayjs';

// Mock dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs = jest.fn(() => ({
    tz: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnValue('2025-08-12T14:03:21-06:00'),
  }));
  
  mockDayjs.extend = jest.fn();
  return mockDayjs;
});

describe('timezone utilities', () => {
  describe('CR_TZ constant', () => {
    it('should export Costa Rica timezone', () => {
      expect(CR_TZ).toBe('America/Costa_Rica');
    });
  });

  describe('nowCRIso', () => {
    it('should return ISO string with Costa Rica timezone', () => {
      const result = nowCRIso();
      expect(result).toBe('2025-08-12T14:03:21-06:00');
    });

    it('should call dayjs with timezone', () => {
      nowCRIso();
      expect(dayjs).toHaveBeenCalled();
    });
  });
});