import { isEmpty, isNotEmpty, unknownToString } from '../../src/utils/stringHelpers';

describe('stringHelpers', () => {
  describe('isEmpty', () => {
    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return true for whitespace-only string', () => {
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty('\t\n')).toBe(true);
    });

    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty('  test  ')).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return false for empty string', () => {
      expect(isNotEmpty('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isNotEmpty('   ')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNotEmpty(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNotEmpty(undefined)).toBe(false);
    });

    it('should return true for non-empty string', () => {
      expect(isNotEmpty('test')).toBe(true);
    });
  });

  describe('unknownToString', () => {
    it('should return string as-is', () => {
      expect(unknownToString('test')).toBe('test');
    });

    it('should return default value for null', () => {
      expect(unknownToString(null, 'default')).toBe('default');
    });

    it('should return default value for undefined', () => {
      expect(unknownToString(undefined, 'default')).toBe('default');
    });

    it('should return empty string for null when no default', () => {
      expect(unknownToString(null)).toBe('');
    });

    it('should convert object to JSON string', () => {
      const obj = { key: 'value', num: 123 };
      expect(unknownToString(obj)).toBe(JSON.stringify(obj));
    });

    it('should convert number to string', () => {
      expect(unknownToString(123)).toBe('123');
      expect(unknownToString(0)).toBe('0');
      expect(unknownToString(-123)).toBe('-123');
    });

    it('should convert boolean to string', () => {
      expect(unknownToString(true)).toBe('true');
      expect(unknownToString(false)).toBe('false');
    });

    it('should convert bigint to string', () => {
      expect(unknownToString(BigInt(123))).toBe('123');
    });

    it('should convert symbol to string', () => {
      const sym = Symbol('test');
      expect(unknownToString(sym)).toBe(sym.toString());
    });

    it('should convert function to string', () => {
      const fn = function test() { return 'test'; };
      expect(unknownToString(fn)).toBe(fn.toString());
    });

    it('should return default for unknown type', () => {
      expect(unknownToString(undefined as any, 'fallback')).toBe('fallback');
    });
  });
});

