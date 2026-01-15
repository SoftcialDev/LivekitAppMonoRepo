import { UserQueryResult } from '../../../src/domain/value-objects/UserQueryResult';
import { UserSummary } from '../../../src/domain/entities/UserSummary';

describe('UserQueryResult', () => {
  describe('toPayload', () => {
    it('should convert result to payload format', () => {
      const users: UserSummary[] = [];
      const result = new UserQueryResult(100, 1, 50, users);
      const payload = result.toPayload();

      expect(payload).toEqual({
        total: 100,
        page: 1,
        pageSize: 50,
        users: users
      });
    });
  });
});

