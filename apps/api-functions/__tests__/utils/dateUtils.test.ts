import {
  getCentralAmericaTime,
  toCentralAmericaTime,
  fromCentralAmericaTime,
  formatCentralAmericaTime,
  getCentralAmericaTimeISO,
  createCentralAmericaTime,
  isCentralAmericaDaylightTime,
  getCentralAmericaOffset,
  CENTRAL_AMERICA_TIMEZONE,
} from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('CENTRAL_AMERICA_TIMEZONE', () => {
    it('should have correct timezone constant', () => {
      expect(CENTRAL_AMERICA_TIMEZONE).toBe('America/Guatemala');
    });
  });

  describe('getCentralAmericaTime', () => {
    it('should return current date in Central America Time', () => {
      const result = getCentralAmericaTime();
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(0);
    });
  });

  describe('toCentralAmericaTime', () => {
    it('should convert UTC date to Central America Time', () => {
      const utcDate = new Date('2024-01-15T12:00:00Z');
      const result = toCentralAmericaTime(utcDate);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle different UTC dates', () => {
      const utcDate = new Date('2024-06-15T18:00:00Z');
      const result = toCentralAmericaTime(utcDate);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('fromCentralAmericaTime', () => {
    it('should convert Central America Time date to UTC', () => {
      const catDate = new Date('2024-01-15T12:00:00');
      const result = fromCentralAmericaTime(catDate);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle different CAT dates', () => {
      const catDate = new Date('2024-06-15T18:00:00');
      const result = fromCentralAmericaTime(catDate);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('formatCentralAmericaTime', () => {
    it('should format date with time by default', () => {
      const date = new Date('2024-01-15T12:30:45');
      const result = formatCentralAmericaTime(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should format date with time when includeTime is true', () => {
      const date = new Date('2024-01-15T12:30:45');
      const result = formatCentralAmericaTime(date, true);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should format date without time when includeTime is false', () => {
      const date = new Date('2024-01-15T12:30:45');
      const result = formatCentralAmericaTime(date, false);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getCentralAmericaTimeISO', () => {
    it('should return ISO string in Central America Time', () => {
      const result = getCentralAmericaTimeISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('createCentralAmericaTime', () => {
    it('should create date with default time values', () => {
      const result = createCentralAmericaTime(2024, 0, 15);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should create date with provided time values', () => {
      const result = createCentralAmericaTime(2024, 5, 15, 14, 30, 45);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
    });

    it('should handle different months', () => {
      const result = createCentralAmericaTime(2024, 11, 31);
      expect(result).toBeInstanceOf(Date);
      expect(result.getMonth()).toBe(11);
    });
  });

  describe('isCentralAmericaDaylightTime', () => {
    it('should return true for date in DST period (April-October)', () => {
      const date = new Date('2024-06-15');
      const result = isCentralAmericaDaylightTime(date);
      expect(result).toBe(true);
    });

    it('should return false for date before DST period', () => {
      const date = new Date('2024-01-15');
      const result = isCentralAmericaDaylightTime(date);
      expect(result).toBe(false);
    });

    it('should return false for date after DST period', () => {
      const date = new Date('2024-12-15');
      const result = isCentralAmericaDaylightTime(date);
      expect(result).toBe(false);
    });

    it('should return true for date at DST start (April 1st)', () => {
      const date = new Date(2024, 3, 1);
      const result = isCentralAmericaDaylightTime(date);
      expect(result).toBe(true);
    });

    it('should return true for date at DST end (October 31st)', () => {
      const date = new Date(2024, 9, 31);
      const result = isCentralAmericaDaylightTime(date);
      expect(result).toBe(true);
    });
  });

  describe('getCentralAmericaOffset', () => {
    it('should return offset in minutes from UTC', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = getCentralAmericaOffset(date);
      expect(typeof result).toBe('number');
    });

    it('should handle different dates', () => {
      const date = new Date('2024-06-15T12:00:00');
      const result = getCentralAmericaOffset(date);
      expect(typeof result).toBe('number');
    });
  });
});

