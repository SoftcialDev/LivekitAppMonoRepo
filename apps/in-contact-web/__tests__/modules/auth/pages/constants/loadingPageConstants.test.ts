import {
  MAX_RETRY_TIME_MS,
  MAX_RETRY_ATTEMPTS,
  RETRY_INTERVAL_MS,
} from '@/modules/auth/pages/constants/loadingPageConstants';

describe('loadingPageConstants', () => {
  describe('MAX_RETRY_TIME_MS', () => {
    it('should be 60000 milliseconds (1 minute)', () => {
      expect(MAX_RETRY_TIME_MS).toBe(60000);
    });

    it('should be a number', () => {
      expect(typeof MAX_RETRY_TIME_MS).toBe('number');
    });
  });

  describe('MAX_RETRY_ATTEMPTS', () => {
    it('should be 4', () => {
      expect(MAX_RETRY_ATTEMPTS).toBe(4);
    });

    it('should be a number', () => {
      expect(typeof MAX_RETRY_ATTEMPTS).toBe('number');
    });
  });

  describe('RETRY_INTERVAL_MS', () => {
    it('should be calculated as MAX_RETRY_TIME_MS / MAX_RETRY_ATTEMPTS', () => {
      const expectedValue = Math.floor(MAX_RETRY_TIME_MS / MAX_RETRY_ATTEMPTS);
      expect(RETRY_INTERVAL_MS).toBe(expectedValue);
    });

    it('should be 15000 milliseconds (15 seconds)', () => {
      expect(RETRY_INTERVAL_MS).toBe(15000);
    });

    it('should be a number', () => {
      expect(typeof RETRY_INTERVAL_MS).toBe('number');
    });

    it('should evenly distribute retry attempts over max time', () => {
      const totalTime = RETRY_INTERVAL_MS * MAX_RETRY_ATTEMPTS;
      expect(totalTime).toBeLessThanOrEqual(MAX_RETRY_TIME_MS);
    });

    it('should ensure all retry attempts fit within max time', () => {
      const timeForAllAttempts = RETRY_INTERVAL_MS * MAX_RETRY_ATTEMPTS;
      expect(timeForAllAttempts).toBe(MAX_RETRY_TIME_MS);
    });
  });
});

