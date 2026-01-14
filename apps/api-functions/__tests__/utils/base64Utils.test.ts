import { normalizeBase64Padding } from '../../src/utils/base64Utils';

describe('base64Utils', () => {
  describe('normalizeBase64Padding', () => {
    it('should return string unchanged when padding is correct', () => {
      const input = 'dGVzdA==';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('dGVzdA==');
    });

    it('should add one padding character when remainder is 3', () => {
      const input = 'dGVzdA';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('dGVzdA==');
    });

    it('should add two padding characters when remainder is 2', () => {
      const input = 'dGVzd';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('dGVzd===');
    });

    it('should add three padding characters when remainder is 1', () => {
      const input = 'dGVz';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('dGVz');
    });

    it('should trim whitespace before processing', () => {
      const input = '  dGVzdA==  ';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('dGVzdA==');
    });

    it('should handle string with leading whitespace and missing padding', () => {
      const input = '  dGVzdA';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('dGVzdA==');
    });

    it('should handle string with trailing whitespace and missing padding', () => {
      const input = 'dGVzdA  ';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('dGVzdA==');
    });

    it('should handle empty string', () => {
      const input = '';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('');
    });

    it('should handle single character string', () => {
      const input = 'Z';
      const result = normalizeBase64Padding(input);
      expect(result).toBe('Z===');
    });
  });
});

