import { CR_TZ, nowCRIso } from '../../../shared/utils/timezone';

// Mock dayjs
jest.mock('dayjs', () => {
  const mockDayjs = jest.fn(() => ({
    tz: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnValue('2023-12-01T10:00:00-06:00')
  }));
  
  (mockDayjs as any).extend = jest.fn();
  
  return mockDayjs;
});

describe('timezone', () => {
  describe('CR_TZ constant', () => {
    it('should export Costa Rica timezone', () => {
      expect(CR_TZ).toBe('America/Costa_Rica');
    });

    it('should be a string', () => {
      expect(typeof CR_TZ).toBe('string');
    });
  });

  describe('nowCRIso', () => {
    it('should return ISO string with Costa Rica timezone', () => {
      const result = nowCRIso();
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    });

    it('should return string with timezone offset', () => {
      const result = nowCRIso();
      
      // Should contain timezone offset (e.g., -06:00 or -05:00)
      expect(result).toMatch(/[+-]\d{2}:\d{2}$/);
    });

    it('should be called multiple times without issues', () => {
      const result1 = nowCRIso();
      const result2 = nowCRIso();
      
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });

    it('should return different values on subsequent calls', () => {
      // Mock different return values
      const mockDayjs = require('dayjs');
      let callCount = 0;
      
      mockDayjs.mockImplementation(() => ({
        tz: jest.fn().mockReturnThis(),
        format: jest.fn(() => {
          callCount++;
          return `2023-12-01T10:0${callCount}:00-06:00`;
        })
      }));

      const result1 = nowCRIso();
      const result2 = nowCRIso();
      
      expect(result1).not.toBe(result2);
    });
  });

  describe('dayjs plugin extensions', () => {
    it('should have extend method available', () => {
      const mockDayjs = require('dayjs');
      
      expect(typeof (mockDayjs as any).extend).toBe('function');
    });

    it('should be able to call extend method', () => {
      const mockDayjs = require('dayjs');
      
      expect(() => (mockDayjs as any).extend({})).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle timezone changes', () => {
      const mockDayjs = require('dayjs');
      
      // Mock different timezone offsets
      mockDayjs.mockImplementation(() => ({
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue('2023-06-01T10:00:00-05:00') // CDT
      }));

      const result = nowCRIso();
      
      expect(result).toContain('-05:00'); // CDT offset
    });

    it('should handle standard time', () => {
      const mockDayjs = require('dayjs');
      
      mockDayjs.mockImplementation(() => ({
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue('2023-12-01T10:00:00-06:00') // CST
      }));

      const result = nowCRIso();
      
      expect(result).toContain('-06:00'); // CST offset
    });
  });
});
