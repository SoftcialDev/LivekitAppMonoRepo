import { RolePermission } from '../../../src/domain/entities/RolePermission';
import { MissingRequiredFieldsError } from '../../../src/domain/errors/EntityValidationErrors';

describe('RolePermission', () => {
  const baseProps = {
    id: 'rp-id',
    roleId: 'role-id',
    permissionId: 'permission-id',
    granted: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('constructor', () => {
    it('should create RolePermission with all properties', () => {
      const rolePermission = new RolePermission(
        baseProps.id,
        baseProps.roleId,
        baseProps.permissionId,
        baseProps.granted,
        baseProps.createdAt,
        baseProps.updatedAt
      );

      expect(rolePermission.id).toBe(baseProps.id);
      expect(rolePermission.roleId).toBe(baseProps.roleId);
      expect(rolePermission.permissionId).toBe(baseProps.permissionId);
      expect(rolePermission.granted).toBe(baseProps.granted);
      expect(rolePermission.createdAt).toBe(baseProps.createdAt);
      expect(rolePermission.updatedAt).toBe(baseProps.updatedAt);
    });

    it('should create RolePermission with granted set to false', () => {
      const rolePermission = new RolePermission(
        baseProps.id,
        baseProps.roleId,
        baseProps.permissionId,
        false,
        baseProps.createdAt,
        baseProps.updatedAt
      );

      expect(rolePermission.granted).toBe(false);
    });

    it('should throw MissingRequiredFieldsError when roleId is missing', () => {
      expect(() => {
        new RolePermission(
          baseProps.id,
          '',
          baseProps.permissionId,
          baseProps.granted,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError when roleId is null', () => {
      expect(() => {
        new RolePermission(
          baseProps.id,
          null as any,
          baseProps.permissionId,
          baseProps.granted,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError when permissionId is missing', () => {
      expect(() => {
        new RolePermission(
          baseProps.id,
          baseProps.roleId,
          '',
          baseProps.granted,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError when permissionId is null', () => {
      expect(() => {
        new RolePermission(
          baseProps.id,
          baseProps.roleId,
          null as any,
          baseProps.granted,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError with correct message', () => {
      expect(() => {
        new RolePermission(
          baseProps.id,
          '',
          '',
          baseProps.granted,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow('RolePermission requires roleId and permissionId');
    });

    it('should accept valid roleId and permissionId', () => {
      expect(() => {
        new RolePermission(
          baseProps.id,
          'valid-role-id',
          'valid-permission-id',
          baseProps.granted,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).not.toThrow();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const rolePermission = new RolePermission(
        baseProps.id,
        baseProps.roleId,
        baseProps.permissionId,
        baseProps.granted,
        baseProps.createdAt,
        baseProps.updatedAt
      );

      // TypeScript enforces readonly at compile time, but we can verify the values are set
      expect(rolePermission.id).toBe(baseProps.id);
      expect(rolePermission.roleId).toBe(baseProps.roleId);
    });
  });
});



