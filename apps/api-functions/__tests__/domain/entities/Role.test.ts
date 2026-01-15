import { Role } from '../../../src/domain/entities/Role';
import { Permission } from '../../../src/domain/entities/Permission';
import { MissingRequiredFieldsError } from '../../../src/domain/errors/EntityValidationErrors';

describe('Role', () => {
  describe('constructor', () => {
    it('should throw MissingRequiredFieldsError when name is empty', () => {
      expect(() => {
        new Role('role-id', '', false, true, new Date(), new Date());
      }).toThrow(MissingRequiredFieldsError);
      expect(() => {
        new Role('role-id', '', false, true, new Date(), new Date());
      }).toThrow('Role name is required');
    });
  });

  describe('addPermission', () => {
    it('should add permission if not already present', () => {
      const role = new Role(
        'role-id',
        'Test Role',
        false,
        true,
        new Date(),
        new Date()
      );
      const permission = new Permission(
        'perm-id',
        'resource:action',
        'Test Permission',
        'resource',
        'action',
        true,
        new Date(),
        new Date()
      );

      role.addPermission(permission);

      expect(role.permissions).toHaveLength(1);
      expect(role.permissions[0]).toBe(permission);
    });

    it('should not add permission if already present', () => {
      const role = new Role(
        'role-id',
        'Test Role',
        false,
        true,
        new Date(),
        new Date()
      );
      const permission = new Permission(
        'perm-id',
        'resource:action',
        'Test Permission',
        'resource',
        'action',
        true,
        new Date(),
        new Date()
      );

      role.addPermission(permission);
      role.addPermission(permission);

      expect(role.permissions).toHaveLength(1);
    });
  });

  describe('removePermission', () => {
    it('should remove permission if present', () => {
      const role = new Role(
        'role-id',
        'Test Role',
        false,
        true,
        new Date(),
        new Date()
      );
      const permission = new Permission(
        'perm-id',
        'resource:action',
        'Test Permission',
        'resource',
        'action',
        true,
        new Date(),
        new Date()
      );

      role.addPermission(permission);
      role.removePermission('perm-id');

      expect(role.permissions).toHaveLength(0);
    });

    it('should not throw when removing non-existent permission', () => {
      const role = new Role(
        'role-id',
        'Test Role',
        false,
        true,
        new Date(),
        new Date()
      );

      expect(() => {
        role.removePermission('non-existent-id');
      }).not.toThrow();
      expect(role.permissions).toHaveLength(0);
    });
  });
});


