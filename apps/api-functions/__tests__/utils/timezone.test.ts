import { nowCRIso, CR_TZ } from '../../src/utils/timezone';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(tz);

describe('timezone', () => {
  describe('CR_TZ', () => {
    it('should be America/Costa_Rica', () => {
      expect(CR_TZ).toBe('America/Costa_Rica');
    });
  });

  describe('nowCRIso', () => {
    it('should return ISO string with timezone offset', () => {
      const result = nowCRIso();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    });

    it('should return time in Costa Rica timezone', () => {
      const result = nowCRIso();
      const parsed = dayjs.tz(result, CR_TZ);

      expect(parsed.isValid()).toBe(true);
    });
  });
});

