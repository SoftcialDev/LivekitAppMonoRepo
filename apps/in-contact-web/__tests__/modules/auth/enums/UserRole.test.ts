import { UserRole } from '@/modules/auth/enums/UserRole';

describe('UserRole', () => {
  it('should have all expected role values', () => {
    expect(UserRole.Admin).toBe('Admin');
    expect(UserRole.Supervisor).toBe('Supervisor');
    expect(UserRole.PSO).toBe('PSO');
    expect(UserRole.ContactManager).toBe('ContactManager');
    expect(UserRole.SuperAdmin).toBe('SuperAdmin');
  });

  it('should have exactly 5 role values', () => {
    const roleValues = Object.values(UserRole);
    expect(roleValues).toHaveLength(5);
  });

  it('should have all string values', () => {
    const roleValues = Object.values(UserRole);
    roleValues.forEach(role => {
      expect(typeof role).toBe('string');
      expect(role.length).toBeGreaterThan(0);
    });
  });

  it('should have unique values', () => {
    const roleValues = Object.values(UserRole);
    const uniqueValues = new Set(roleValues);
    expect(uniqueValues.size).toBe(roleValues.length);
  });
});


