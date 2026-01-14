import { Context } from '@azure/functions';
import { extractCallerId, tryExtractCallerId, getCallerAdId } from '../../src/utils/authHelpers';
import { CallerIdNotFoundError } from '../../src/domain/errors';
import { TestUtils } from '../setup';

describe('authHelpers', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
  });

  describe('extractCallerId', () => {
    it('should extract caller ID from oid claim', () => {
      mockContext.bindings.user = { oid: 'user-oid-123' };

      const result = extractCallerId(mockContext);

      expect(result).toBe('user-oid-123');
    });

    it('should extract caller ID from sub claim when oid is not present', () => {
      mockContext.bindings.user = { sub: 'user-sub-456' };

      const result = extractCallerId(mockContext);

      expect(result).toBe('user-sub-456');
    });

    it('should prefer oid over sub when both are present', () => {
      mockContext.bindings.user = { oid: 'user-oid-123', sub: 'user-sub-456' };

      const result = extractCallerId(mockContext);

      expect(result).toBe('user-oid-123');
    });

    it('should throw CallerIdNotFoundError when neither oid nor sub is present', () => {
      mockContext.bindings.user = {};

      expect(() => extractCallerId(mockContext)).toThrow(CallerIdNotFoundError);
      expect(() => extractCallerId(mockContext)).toThrow('Cannot determine caller identity');
    });

    it('should throw CallerIdNotFoundError when user binding is undefined', () => {
      mockContext.bindings = {} as any;

      expect(() => extractCallerId(mockContext)).toThrow();
    });

    it('should throw CallerIdNotFoundError when oid and sub are undefined', () => {
      mockContext.bindings.user = { oid: undefined, sub: undefined };

      expect(() => extractCallerId(mockContext)).toThrow(CallerIdNotFoundError);
    });
  });

  describe('tryExtractCallerId', () => {
    it('should return caller ID when extraction succeeds', () => {
      mockContext.bindings.user = { oid: 'user-oid-123' };

      const result = tryExtractCallerId(mockContext);

      expect(result).toBe('user-oid-123');
    });

    it('should return null when extraction fails', () => {
      mockContext.bindings.user = {};

      const result = tryExtractCallerId(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when user binding is undefined', () => {
      mockContext.bindings.user = undefined;

      const result = tryExtractCallerId(mockContext);

      expect(result).toBeNull();
    });
  });

  describe('getCallerAdId', () => {
    it('should return oid when present', () => {
      const claims = { oid: 'user-oid-123' };

      const result = getCallerAdId(claims);

      expect(result).toBe('user-oid-123');
    });

    it('should return sub when oid is not present', () => {
      const claims = { sub: 'user-sub-456' };

      const result = getCallerAdId(claims);

      expect(result).toBe('user-sub-456');
    });

    it('should prefer oid over sub when both are present', () => {
      const claims = { oid: 'user-oid-123', sub: 'user-sub-456' };

      const result = getCallerAdId(claims);

      expect(result).toBe('user-oid-123');
    });

    it('should return undefined when neither oid nor sub is present', () => {
      const claims = {};

      const result = getCallerAdId(claims);

      expect(result).toBeUndefined();
    });

    it('should return undefined when oid and sub are undefined', () => {
      const claims = { oid: undefined, sub: undefined };

      const result = getCallerAdId(claims);

      expect(result).toBeUndefined();
    });
  });
});

