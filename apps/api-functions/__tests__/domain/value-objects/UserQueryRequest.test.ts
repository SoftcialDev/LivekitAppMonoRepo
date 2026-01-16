import { UserQueryRequest } from '../../../src/domain/value-objects/UserQueryRequest';
import { UserRole } from '@prisma/client';
import { ValidationError } from '../../../src/domain/errors/DomainError';

describe('UserQueryRequest', () => {
  describe('fromQueryString', () => {
    it('should throw ValidationError when role parameter is empty', () => {
      expect(() => {
        UserQueryRequest.fromQueryString({});
      }).toThrow(ValidationError);
    });

    it('should handle null role mapping', () => {
      const request = UserQueryRequest.fromQueryString({ role: 'null' });
      expect(request.roles).toContain(null);
    });

    it('should throw ValidationError for invalid role', () => {
      expect(() => {
        UserQueryRequest.fromQueryString({ role: 'InvalidRole' });
      }).toThrow(ValidationError);
    });
  });

  describe('toPayload', () => {
    it('should convert request to payload format with null role', () => {
      const request = new UserQueryRequest([null, UserRole.PSO], 1, 50);
      const payload = request.toPayload();

      expect(payload.roles).toEqual(['null', UserRole.PSO]);
      expect(payload.page).toBe(1);
      expect(payload.pageSize).toBe(50);
    });
  });
});



