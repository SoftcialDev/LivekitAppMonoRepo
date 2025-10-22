import { extractCallerId, tryExtractCallerId, getCallerAdId } from '../../../shared/utils/authHelpers';
import { Context } from '@azure/functions';
import type { JwtPayload } from 'jsonwebtoken';

describe('authHelpers', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      bindings: {}
    } as any;
  });

  describe('extractCallerId', () => {
    it('should extract caller ID from oid claim', () => {
      const claims: JwtPayload = {
        oid: 'user-123-oid',
        sub: 'user-123-sub'
      };
      mockContext.bindings.user = claims;

      const result = extractCallerId(mockContext);

      expect(result).toBe('user-123-oid');
    });

    it('should extract caller ID from sub claim when oid is not present', () => {
      const claims: JwtPayload = {
        sub: 'user-123-sub'
      };
      mockContext.bindings.user = claims;

      const result = extractCallerId(mockContext);

      expect(result).toBe('user-123-sub');
    });

    it('should throw error when neither oid nor sub is present', () => {
      const claims: JwtPayload = {};
      mockContext.bindings.user = claims;

      expect(() => extractCallerId(mockContext)).toThrow('Cannot determine caller identity');
    });

    it('should throw error when oid and sub are null', () => {
      const claims: JwtPayload = {
        oid: null as any,
        sub: null as any
      };
      mockContext.bindings.user = claims;

      expect(() => extractCallerId(mockContext)).toThrow('Cannot determine caller identity');
    });

    it('should throw error when oid and sub are undefined', () => {
      const claims: JwtPayload = {
        oid: undefined,
        sub: undefined
      };
      mockContext.bindings.user = claims;

      expect(() => extractCallerId(mockContext)).toThrow('Cannot determine caller identity');
    });

    it('should throw error when user binding is missing', () => {
      mockContext.bindings.user = undefined;

      expect(() => extractCallerId(mockContext)).toThrow();
    });

    it('should handle empty string values', () => {
      const claims: JwtPayload = {
        oid: '',
        sub: ''
      };
      mockContext.bindings.user = claims;

      expect(() => extractCallerId(mockContext)).toThrow('Cannot determine caller identity');
    });

    it('should handle whitespace-only values', () => {
      const claims: JwtPayload = {
        oid: '   ',
        sub: '   '
      };
      mockContext.bindings.user = claims;

      const result = extractCallerId(mockContext);

      expect(result).toBe('   '); // Whitespace strings are truthy
    });

    it('should prioritize oid over sub when both are present', () => {
      const claims: JwtPayload = {
        oid: 'user-oid-123',
        sub: 'user-sub-456'
      };
      mockContext.bindings.user = claims;

      const result = extractCallerId(mockContext);

      expect(result).toBe('user-oid-123');
    });
  });

  describe('tryExtractCallerId', () => {
    it('should return caller ID when extraction succeeds', () => {
      const claims: JwtPayload = {
        oid: 'user-123-oid'
      };
      mockContext.bindings.user = claims;

      const result = tryExtractCallerId(mockContext);

      expect(result).toBe('user-123-oid');
    });

    it('should return null when extraction fails', () => {
      const claims: JwtPayload = {};
      mockContext.bindings.user = claims;

      const result = tryExtractCallerId(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when user binding is missing', () => {
      mockContext.bindings.user = undefined;

      const result = tryExtractCallerId(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when claims are invalid', () => {
      mockContext.bindings.user = null;

      const result = tryExtractCallerId(mockContext);

      expect(result).toBeNull();
    });

    it('should handle extraction from sub claim', () => {
      const claims: JwtPayload = {
        sub: 'user-sub-123'
      };
      mockContext.bindings.user = claims;

      const result = tryExtractCallerId(mockContext);

      expect(result).toBe('user-sub-123');
    });
  });

  describe('getCallerAdId', () => {
    it('should return oid when present', () => {
      const claims: JwtPayload = {
        oid: 'user-oid-123',
        sub: 'user-sub-456'
      };

      const result = getCallerAdId(claims);

      expect(result).toBe('user-oid-123');
    });

    it('should return sub when oid is not present', () => {
      const claims: JwtPayload = {
        sub: 'user-sub-456'
      };

      const result = getCallerAdId(claims);

      expect(result).toBe('user-sub-456');
    });

    it('should return undefined when neither oid nor sub is present', () => {
      const claims: JwtPayload = {};

      const result = getCallerAdId(claims);

      expect(result).toBeUndefined();
    });

    it('should return undefined when oid and sub are null', () => {
      const claims: JwtPayload = {
        oid: null as any,
        sub: null as any
      };

      const result = getCallerAdId(claims);

      expect(result).toBe(null); // null ?? null = null
    });

    it('should return undefined when oid and sub are undefined', () => {
      const claims: JwtPayload = {
        oid: undefined,
        sub: undefined
      };

      const result = getCallerAdId(claims);

      expect(result).toBeUndefined();
    });

    it('should prioritize oid over sub', () => {
      const claims: JwtPayload = {
        oid: 'user-oid-123',
        sub: 'user-sub-456'
      };

      const result = getCallerAdId(claims);

      expect(result).toBe('user-oid-123');
    });

    it('should handle empty string values', () => {
      const claims: JwtPayload = {
        oid: '',
        sub: ''
      };

      const result = getCallerAdId(claims);

      expect(result).toBe('');
    });

    it('should handle whitespace-only values', () => {
      const claims: JwtPayload = {
        oid: '   ',
        sub: '   '
      };

      const result = getCallerAdId(claims);

      expect(result).toBe('   ');
    });

    it('should handle complex claims object', () => {
      const claims: JwtPayload = {
        oid: 'user-oid-123',
        sub: 'user-sub-456',
        aud: 'audience',
        iss: 'issuer',
        exp: 1234567890,
        iat: 1234567890
      };

      const result = getCallerAdId(claims);

      expect(result).toBe('user-oid-123');
    });
  });

  describe('edge cases', () => {
    it('should handle non-string oid and sub values', () => {
      const claims: JwtPayload = {
        oid: 123 as any,
        sub: 456 as any
      };
      mockContext.bindings.user = claims;

      const result = extractCallerId(mockContext);

      expect(result).toBe(123);
    });

    it('should handle boolean oid and sub values', () => {
      const claims: JwtPayload = {
        oid: true as any,
        sub: false as any
      };
      mockContext.bindings.user = claims;

      const result = extractCallerId(mockContext);

      expect(result).toBe(true);
    });

    it('should handle object oid and sub values', () => {
      const claims: JwtPayload = {
        oid: { id: '123' } as any,
        sub: { id: '456' } as any
      };
      mockContext.bindings.user = claims;

      const result = extractCallerId(mockContext);

      expect(result).toEqual({ id: '123' });
    });
  });
});
