import {
  CENTRAL_AMERICA_TIMEZONE,
  getCentralAmericaTime,
  toCentralAmericaTime,
  fromCentralAmericaTime,
  formatCentralAmericaTime,
  getCentralAmericaTimeISO,
  createCentralAmericaTime,
  isCentralAmericaDaylightTime,
  getCentralAmericaOffset
} from '../../../shared/utils/dateUtils';

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  toZonedTime: jest.fn(),
  fromZonedTime: jest.fn(),
  format: jest.fn()
}));

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

const mockToZonedTime = toZonedTime as jest.MockedFunction<typeof toZonedTime>;
const mockFromZonedTime = fromZonedTime as jest.MockedFunction<typeof fromZonedTime>;
const mockFormat = format as jest.MockedFunction<typeof format>;

describe('dateUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() to return a fixed timestamp
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01T00:00:00.000Z
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CENTRAL_AMERICA_TIMEZONE', () => {
    it('should export Central America timezone constant', () => {
      expect(CENTRAL_AMERICA_TIMEZONE).toBe('America/Guatemala');
    });
  });

  describe('getCentralAmericaTime', () => {
    it('should return current date in Central America Time', () => {
      const mockDate = new Date('2022-01-01T06:00:00.000Z'); // UTC
      const mockCatTime = new Date('2022-01-01T00:00:00.000'); // CAT (UTC-6)
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = getCentralAmericaTime();
      
      expect(mockToZonedTime).toHaveBeenCalledWith(expect.any(Date), CENTRAL_AMERICA_TIMEZONE);
      expect(result).toEqual(mockCatTime);
    });

    it('should handle different time zones correctly', () => {
      const mockDate = new Date('2022-07-01T05:00:00.000Z'); // UTC
      const mockCatTime = new Date('2022-07-01T00:00:00.000'); // CAT (UTC-5 during DST)
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = getCentralAmericaTime();
      
      expect(result).toEqual(mockCatTime);
    });
  });

  describe('toCentralAmericaTime', () => {
    it('should convert UTC date to Central America Time', () => {
      const utcDate = new Date('2022-01-01T12:00:00.000Z');
      const mockCatTime = new Date('2022-01-01T06:00:00.000');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = toCentralAmericaTime(utcDate);
      
      expect(mockToZonedTime).toHaveBeenCalledWith(utcDate, CENTRAL_AMERICA_TIMEZONE);
      expect(result).toEqual(mockCatTime);
    });

    it('should handle edge case dates', () => {
      const utcDate = new Date('2022-12-31T23:59:59.999Z');
      const mockCatTime = new Date('2022-12-31T17:59:59.999');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = toCentralAmericaTime(utcDate);
      
      expect(result).toEqual(mockCatTime);
    });
  });

  describe('fromCentralAmericaTime', () => {
    it('should convert Central America Time date to UTC', () => {
      const catDate = new Date('2022-01-01T06:00:00.000');
      const mockUtcTime = new Date('2022-01-01T12:00:00.000Z');
      
      mockFromZonedTime.mockReturnValue(mockUtcTime);
      
      const result = fromCentralAmericaTime(catDate);
      
      expect(mockFromZonedTime).toHaveBeenCalledWith(catDate, CENTRAL_AMERICA_TIMEZONE);
      expect(result).toEqual(mockUtcTime);
    });

    it('should handle different CAT dates', () => {
      const catDate = new Date('2022-07-01T00:00:00.000');
      const mockUtcTime = new Date('2022-07-01T05:00:00.000Z');
      
      mockFromZonedTime.mockReturnValue(mockUtcTime);
      
      const result = fromCentralAmericaTime(catDate);
      
      expect(result).toEqual(mockUtcTime);
    });
  });

  describe('formatCentralAmericaTime', () => {
    it('should format date with time by default', () => {
      const date = new Date('2022-01-01T12:00:00.000Z');
      const mockFormatted = '2022-01-01 06:00:00';
      
      mockFormat.mockReturnValue(mockFormatted);
      
      const result = formatCentralAmericaTime(date);
      
      expect(mockFormat).toHaveBeenCalledWith(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: CENTRAL_AMERICA_TIMEZONE });
      expect(result).toBe(mockFormatted);
    });

    it('should format date without time when includeTime is false', () => {
      const date = new Date('2022-01-01T12:00:00.000Z');
      const mockFormatted = '2022-01-01';
      
      mockFormat.mockReturnValue(mockFormatted);
      
      const result = formatCentralAmericaTime(date, false);
      
      expect(mockFormat).toHaveBeenCalledWith(date, 'yyyy-MM-dd', { timeZone: CENTRAL_AMERICA_TIMEZONE });
      expect(result).toBe(mockFormatted);
    });

    it('should handle different date formats', () => {
      const date = new Date('2022-12-31T23:59:59.999Z');
      const mockFormatted = '2022-12-31 17:59:59';
      
      mockFormat.mockReturnValue(mockFormatted);
      
      const result = formatCentralAmericaTime(date);
      
      expect(result).toBe(mockFormatted);
    });
  });

  describe('getCentralAmericaTimeISO', () => {
    it('should return ISO string of Central America Time', () => {
      const mockCatTime = new Date('2022-01-01T00:00:00.000');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = getCentralAmericaTimeISO();
      
      expect(result).toBe('2022-01-01T06:00:00.000Z');
    });
  });

  describe('createCentralAmericaTime', () => {
    it('should create date with all parameters', () => {
      const mockCatTime = new Date('2022-01-01T12:30:45.000');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = createCentralAmericaTime(2022, 0, 1, 12, 30, 45);
      
      expect(mockToZonedTime).toHaveBeenCalledWith(expect.any(Date), CENTRAL_AMERICA_TIMEZONE);
      expect(result).toEqual(mockCatTime);
    });

    it('should create date with default time values', () => {
      const mockCatTime = new Date('2022-01-01T00:00:00.000');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = createCentralAmericaTime(2022, 0, 1);
      
      expect(result).toEqual(mockCatTime);
    });

    it('should handle edge case dates', () => {
      const mockCatTime = new Date('2022-12-31T23:59:59.000');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = createCentralAmericaTime(2022, 11, 31, 23, 59, 59);
      
      expect(result).toEqual(mockCatTime);
    });
  });

  describe('isCentralAmericaDaylightTime', () => {
    it('should return true for dates during DST period', () => {
      const dstDate = new Date('2022-06-15T12:00:00.000Z'); // June 15th
      
      const result = isCentralAmericaDaylightTime(dstDate);
      
      expect(result).toBe(true);
    });

    it('should return false for dates outside DST period', () => {
      const standardDate = new Date('2022-01-15T12:00:00.000Z'); // January 15th
      
      const result = isCentralAmericaDaylightTime(standardDate);
      
      expect(result).toBe(false);
    });

    it('should return true for DST start date', () => {
      const dstStart = new Date('2022-04-01T12:00:00.000Z'); // April 1st
      
      const result = isCentralAmericaDaylightTime(dstStart);
      
      expect(result).toBe(true);
    });

    it('should return true for DST end date', () => {
      const dstEnd = new Date('2022-10-15T12:00:00.000Z'); // October 15th (middle of DST period)
      
      const result = isCentralAmericaDaylightTime(dstEnd);
      
      expect(result).toBe(true);
    });

    it('should return false for dates just before DST', () => {
      const beforeDst = new Date('2022-03-31T12:00:00.000Z'); // March 31st
      
      const result = isCentralAmericaDaylightTime(beforeDst);
      
      expect(result).toBe(false);
    });

    it('should return false for dates just after DST', () => {
      const afterDst = new Date('2022-11-01T12:00:00.000Z'); // November 1st
      
      const result = isCentralAmericaDaylightTime(afterDst);
      
      expect(result).toBe(false);
    });
  });

  describe('getCentralAmericaOffset', () => {
    it('should calculate timezone offset correctly', () => {
      const date = new Date('2022-01-01T12:00:00.000Z');
      
      // Mock toLocaleString to return predictable values
      jest.spyOn(date, 'toLocaleString')
        .mockReturnValueOnce('1/1/2022, 12:00:00 PM') // UTC
        .mockReturnValueOnce('1/1/2022, 6:00:00 AM'); // CAT
      
      const result = getCentralAmericaOffset(date);
      
      expect(result).toBe(-360); // -6 hours = -360 minutes
    });

    it('should handle DST offset', () => {
      const date = new Date('2022-07-01T12:00:00.000Z');
      
      // Mock toLocaleString to return DST values
      jest.spyOn(date, 'toLocaleString')
        .mockReturnValueOnce('7/1/2022, 12:00:00 PM') // UTC
        .mockReturnValueOnce('7/1/2022, 7:00:00 AM'); // CAT (DST)
      
      const result = getCentralAmericaOffset(date);
      
      expect(result).toBe(-300); // -5 hours = -300 minutes
    });

    it('should handle edge case dates', () => {
      const date = new Date('2022-12-31T23:59:59.999Z');
      
      jest.spyOn(date, 'toLocaleString')
        .mockReturnValueOnce('12/31/2022, 11:59:59 PM') // UTC
        .mockReturnValueOnce('12/31/2022, 5:59:59 PM'); // CAT
      
      const result = getCentralAmericaOffset(date);
      
      expect(result).toBe(-360);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      
      mockToZonedTime.mockReturnValue(new Date('2022-01-01T00:00:00.000'));
      
      expect(() => toCentralAmericaTime(invalidDate)).not.toThrow();
    });

    it('should handle null/undefined dates', () => {
      mockToZonedTime.mockReturnValue(new Date('2022-01-01T00:00:00.000'));
      
      expect(() => toCentralAmericaTime(null as any)).not.toThrow();
      expect(() => toCentralAmericaTime(undefined as any)).not.toThrow();
    });

    it('should handle extreme dates', () => {
      const extremeDate = new Date('1900-01-01T00:00:00.000Z');
      const mockCatTime = new Date('1900-01-01T00:00:00.000');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = toCentralAmericaTime(extremeDate);
      
      expect(result).toEqual(mockCatTime);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete timezone conversion cycle', () => {
      const originalDate = new Date('2022-01-01T12:00:00.000Z');
      const mockCatTime = new Date('2022-01-01T06:00:00.000');
      const mockUtcTime = new Date('2022-01-01T12:00:00.000Z');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      mockFromZonedTime.mockReturnValue(mockUtcTime);
      
      const catTime = toCentralAmericaTime(originalDate);
      const backToUtc = fromCentralAmericaTime(catTime);
      
      expect(catTime).toEqual(mockCatTime);
      expect(backToUtc).toEqual(mockUtcTime);
    });

    it('should handle DST transition dates', () => {
      const dstTransition = new Date('2022-04-01T12:00:00.000Z');
      const mockCatTime = new Date('2022-04-01T07:00:00.000');
      
      mockToZonedTime.mockReturnValue(mockCatTime);
      
      const result = toCentralAmericaTime(dstTransition);
      
      expect(result).toEqual(mockCatTime);
    });
  });
});
