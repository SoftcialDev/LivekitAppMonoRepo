import {
  sanitizeFileName,
  generateSnapshotFileName,
  generateSnapshotFolderPath,
  slugify,
  datePrefixUTC,
} from '../../src/utils/fileNameUtils';

describe('fileNameUtils', () => {
  describe('sanitizeFileName', () => {
    it('should return empty string for null input', () => {
      const result = sanitizeFileName(null as any);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = sanitizeFileName(undefined as any);
      expect(result).toBe('');
    });

    it('should return empty string for non-string input', () => {
      const result = sanitizeFileName(123 as any);
      expect(result).toBe('');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = sanitizeFileName('  test  ');
      expect(result).toBe('test');
    });

    it('should replace spaces with underscores', () => {
      const result = sanitizeFileName('test file name');
      expect(result).toBe('test_file_name');
    });

    it('should replace multiple spaces with single underscore', () => {
      const result = sanitizeFileName('test    file');
      expect(result).toBe('test_file');
    });

    it('should remove special characters', () => {
      const result = sanitizeFileName('test@file#name$123');
      expect(result).toBe('testfilename123');
    });

    it('should keep letters, numbers, underscores, hyphens, and dots', () => {
      const result = sanitizeFileName('test_file-name.123');
      expect(result).toBe('test_file-name.123');
    });

    it('should remove multiple consecutive underscores', () => {
      const result = sanitizeFileName('test___file');
      expect(result).toBe('test_file');
    });

    it('should remove leading underscores, dots, and hyphens', () => {
      const result = sanitizeFileName('_test_file');
      expect(result).toBe('test_file');
    });

    it('should remove trailing underscores, dots, and hyphens', () => {
      const result = sanitizeFileName('test_file_');
      expect(result).toBe('test_file');
    });

    it('should truncate to max length', () => {
      const result = sanitizeFileName('a'.repeat(100), 50);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should remove trailing underscore after truncation', () => {
      const result = sanitizeFileName('a'.repeat(50) + '_', 50);
      expect(result).not.toMatch(/_$/);
    });

    it('should return "unknown" for empty string after sanitization', () => {
      const result = sanitizeFileName('!!!');
      expect(result).toBe('unknown');
    });

    it('should use default max length of 50', () => {
      const result = sanitizeFileName('a'.repeat(100));
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('generateSnapshotFileName', () => {
    it('should generate correct file name format', () => {
      const psoName = 'John Doe';
      const reasonCode = 'test-reason';
      const timestamp = new Date('2024-01-15T14:30:45Z');
      const snapshotId = '12345678-abcd-efgh-ijkl-123456789012';

      const result = generateSnapshotFileName(psoName, reasonCode, timestamp, snapshotId);

      expect(result).toMatch(/^John_Doe_TEST-REASON_\d{8}_\d{6}_[a-f0-9]{6}\.jpg$/);
    });

    it('should sanitize PSO name to max 20 chars', () => {
      const psoName = 'A'.repeat(30);
      const reasonCode = 'reason';
      const timestamp = new Date();
      const snapshotId = '12345678-abcd-efgh-ijkl-123456789012';

      const result = generateSnapshotFileName(psoName, reasonCode, timestamp, snapshotId);

      const parts = result.split('_');
      expect(parts[0].length).toBeLessThanOrEqual(20);
    });

    it('should sanitize reason code to max 15 chars and uppercase', () => {
      const psoName = 'John';
      const reasonCode = 'a'.repeat(20);
      const timestamp = new Date();
      const snapshotId = '12345678-abcd-efgh-ijkl-123456789012';

      const result = generateSnapshotFileName(psoName, reasonCode, timestamp, snapshotId);

      const parts = result.split('_');
      expect(parts[1].length).toBeLessThanOrEqual(15);
      expect(parts[1]).toBe(parts[1].toUpperCase());
    });

    it('should format date as YYYYMMDD', () => {
      const psoName = 'John';
      const reasonCode = 'reason';
      const timestamp = new Date('2024-01-15T14:30:45Z');
      const snapshotId = '12345678-abcd-efgh-ijkl-123456789012';

      const result = generateSnapshotFileName(psoName, reasonCode, timestamp, snapshotId);

      expect(result).toContain('20240115');
    });

    it('should format time as HHMMSS', () => {
      const psoName = 'John';
      const reasonCode = 'reason';
      const timestamp = new Date('2024-01-15T14:30:45Z');
      const snapshotId = '12345678-abcd-efgh-ijkl-123456789012';

      const result = generateSnapshotFileName(psoName, reasonCode, timestamp, snapshotId);

      expect(result).toMatch(/_\d{8}_\d{6}_/);
    });

    it('should use last 6 characters of snapshot ID', () => {
      const psoName = 'John';
      const reasonCode = 'reason';
      const timestamp = new Date();
      const snapshotId = '12345678-abcd-efgh-ijkl-123456789012';

      const result = generateSnapshotFileName(psoName, reasonCode, timestamp, snapshotId);

      expect(result).toMatch(/_[a-f0-9]{6}\.jpg$/);
      expect(result.endsWith('9012.jpg')).toBe(true);
    });
  });

  describe('generateSnapshotFolderPath', () => {
    it('should generate folder path in YYYY-MM-DD format', () => {
      const timestamp = new Date('2024-01-15T14:30:45Z');
      const result = generateSnapshotFolderPath(timestamp);
      expect(result).toBe('2024-01-15');
    });

    it('should handle different dates', () => {
      const timestamp = new Date('2024-12-31T23:59:59Z');
      const result = generateSnapshotFolderPath(timestamp);
      expect(result).toBe('2024-12-31');
    });
  });

  describe('slugify', () => {
    it('should convert string to lowercase slug', () => {
      const result = slugify('Test String');
      expect(result).toBe('test-string');
    });

    it('should remove accents and special characters', () => {
      const result = slugify('Café');
      expect(result).toBe('cafe');
    });

    it('should replace non-alphanumeric with hyphens', () => {
      const result = slugify('test@string#123');
      expect(result).toBe('test-string-123');
    });

    it('should remove leading and trailing hyphens', () => {
      const result = slugify('-test-string-');
      expect(result).toBe('test-string');
    });

    it('should use default "user" for null input', () => {
      const result = slugify(null as any);
      expect(result).toBe('user');
    });

    it('should use default "user" for undefined input', () => {
      const result = slugify(undefined as any);
      expect(result).toBe('user');
    });

    it('should handle empty string', () => {
      const result = slugify('');
      expect(result).toBe('user');
    });
  });

  describe('datePrefixUTC', () => {
    it('should generate date prefix in YYYY/MM/DD format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = datePrefixUTC(date);
      expect(result).toBe('2024/01/15');
    });

    it('should use current date when no argument provided', () => {
      const result = datePrefixUTC();
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
    });

    it('should handle different months', () => {
      const date = new Date('2024-12-31T12:00:00Z');
      const result = datePrefixUTC(date);
      expect(result).toBe('2024/12/31');
    });

    it('should pad month and day with zeros', () => {
      const date = new Date('2024-01-05T12:00:00Z');
      const result = datePrefixUTC(date);
      expect(result).toBe('2024/01/05');
    });
  });
});

