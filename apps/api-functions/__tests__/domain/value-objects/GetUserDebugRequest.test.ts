import { GetUserDebugRequest } from '../../../src/domain/value-objects/GetUserDebugRequest';
import { InvalidFormatError } from '../../../src/domain/errors/EntityValidationErrors';

describe('GetUserDebugRequest', () => {
  describe('constructor', () => {
    it('should throw InvalidFormatError when user identifier is empty', () => {
      expect(() => {
        new GetUserDebugRequest('');
      }).toThrow(InvalidFormatError);
    });

    it('should throw InvalidFormatError when user identifier is whitespace only', () => {
      expect(() => {
        new GetUserDebugRequest('   ');
      }).toThrow(InvalidFormatError);
    });

    it('should throw InvalidFormatError when user identifier is null', () => {
      expect(() => {
        new GetUserDebugRequest(null as any);
      }).toThrow(InvalidFormatError);
    });

    it('should create instance with valid identifier', () => {
      const request = new GetUserDebugRequest('user@example.com');
      expect(request.userIdentifier).toBe('user@example.com');
    });
  });

  describe('fromIdentifier', () => {
    it('should trim whitespace from identifier', () => {
      const request = GetUserDebugRequest.fromIdentifier('  user@example.com  ');
      expect(request.userIdentifier).toBe('user@example.com');
    });
  });
});





