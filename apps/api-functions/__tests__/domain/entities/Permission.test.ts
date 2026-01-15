import { Permission } from '../../../src/domain/entities/Permission';
import { InvalidPermissionCodeError } from '../../../src/domain/errors/EntityValidationErrors';

describe('Permission', () => {
  describe('validateCode', () => {
    it('should throw InvalidPermissionCodeError when code does not include colon', () => {
      expect(() => {
        Permission.validateCode('invalidcode');
      }).toThrow(InvalidPermissionCodeError);
    });

    it('should throw InvalidPermissionCodeError when code is empty', () => {
      expect(() => {
        Permission.validateCode('');
      }).toThrow(InvalidPermissionCodeError);
    });

    it('should not throw when code includes colon', () => {
      expect(() => {
        Permission.validateCode('resource:action');
      }).not.toThrow();
    });
  });
});

