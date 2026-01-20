import { UserRoleChangeType } from '../../../src/domain/enums/UserRoleChangeType';

describe('UserRoleChangeType', () => {
  it('should have ROLE_ASSIGNED type', () => {
    expect(UserRoleChangeType.ROLE_ASSIGNED).toBe('ROLE_ASSIGNED');
  });

  it('should have ROLE_REMOVED type', () => {
    expect(UserRoleChangeType.ROLE_REMOVED).toBe('ROLE_REMOVED');
  });

  it('should have USER_DELETED type', () => {
    expect(UserRoleChangeType.USER_DELETED).toBe('USER_DELETED');
  });

  it('should have exactly 3 type values', () => {
    const typeValues = Object.values(UserRoleChangeType);
    expect(typeValues).toHaveLength(3);
  });
});






