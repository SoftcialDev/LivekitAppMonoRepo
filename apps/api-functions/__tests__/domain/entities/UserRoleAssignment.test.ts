import { UserRoleAssignment } from '../../../src/domain/entities/UserRoleAssignment';
import { MissingRequiredFieldsError } from '../../../src/domain/errors/EntityValidationErrors';

describe('UserRoleAssignment', () => {
  const baseProps = {
    id: 'ura-id',
    userId: 'user-id',
    roleId: 'role-id',
    assignedAt: new Date('2024-01-01T10:00:00Z'),
    isActive: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('constructor', () => {
    it('should create UserRoleAssignment with all required properties', () => {
      const assignment = new UserRoleAssignment(
        baseProps.id,
        baseProps.userId,
        baseProps.roleId,
        baseProps.assignedAt,
        baseProps.isActive,
        baseProps.createdAt,
        baseProps.updatedAt
      );

      expect(assignment.id).toBe(baseProps.id);
      expect(assignment.userId).toBe(baseProps.userId);
      expect(assignment.roleId).toBe(baseProps.roleId);
      expect(assignment.assignedAt).toBe(baseProps.assignedAt);
      expect(assignment.isActive).toBe(baseProps.isActive);
      expect(assignment.createdAt).toBe(baseProps.createdAt);
      expect(assignment.updatedAt).toBe(baseProps.updatedAt);
    });

    it('should create UserRoleAssignment with assignedBy', () => {
      const assignedBy = 'admin-id';
      const assignment = new UserRoleAssignment(
        baseProps.id,
        baseProps.userId,
        baseProps.roleId,
        baseProps.assignedAt,
        baseProps.isActive,
        baseProps.createdAt,
        baseProps.updatedAt,
        assignedBy
      );

      expect(assignment.assignedBy).toBe(assignedBy);
    });

    it('should create UserRoleAssignment without assignedBy', () => {
      const assignment = new UserRoleAssignment(
        baseProps.id,
        baseProps.userId,
        baseProps.roleId,
        baseProps.assignedAt,
        baseProps.isActive,
        baseProps.createdAt,
        baseProps.updatedAt
      );

      expect(assignment.assignedBy).toBeUndefined();
    });

    it('should create UserRoleAssignment with isActive set to false', () => {
      const assignment = new UserRoleAssignment(
        baseProps.id,
        baseProps.userId,
        baseProps.roleId,
        baseProps.assignedAt,
        false,
        baseProps.createdAt,
        baseProps.updatedAt
      );

      expect(assignment.isActive).toBe(false);
    });

    it('should throw MissingRequiredFieldsError when userId is missing', () => {
      expect(() => {
        new UserRoleAssignment(
          baseProps.id,
          '',
          baseProps.roleId,
          baseProps.assignedAt,
          baseProps.isActive,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError when userId is null', () => {
      expect(() => {
        new UserRoleAssignment(
          baseProps.id,
          null as any,
          baseProps.roleId,
          baseProps.assignedAt,
          baseProps.isActive,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError when roleId is missing', () => {
      expect(() => {
        new UserRoleAssignment(
          baseProps.id,
          baseProps.userId,
          '',
          baseProps.assignedAt,
          baseProps.isActive,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError when roleId is null', () => {
      expect(() => {
        new UserRoleAssignment(
          baseProps.id,
          baseProps.userId,
          null as any,
          baseProps.assignedAt,
          baseProps.isActive,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow(MissingRequiredFieldsError);
    });

    it('should throw MissingRequiredFieldsError with correct message', () => {
      expect(() => {
        new UserRoleAssignment(
          baseProps.id,
          '',
          '',
          baseProps.assignedAt,
          baseProps.isActive,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).toThrow('UserRoleAssignment requires userId and roleId');
    });

    it('should accept valid userId and roleId', () => {
      expect(() => {
        new UserRoleAssignment(
          baseProps.id,
          'valid-user-id',
          'valid-role-id',
          baseProps.assignedAt,
          baseProps.isActive,
          baseProps.createdAt,
          baseProps.updatedAt
        );
      }).not.toThrow();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const assignment = new UserRoleAssignment(
        baseProps.id,
        baseProps.userId,
        baseProps.roleId,
        baseProps.assignedAt,
        baseProps.isActive,
        baseProps.createdAt,
        baseProps.updatedAt
      );

      // TypeScript enforces readonly at compile time, but we can verify the values are set
      expect(assignment.id).toBe(baseProps.id);
      expect(assignment.userId).toBe(baseProps.userId);
      expect(assignment.roleId).toBe(baseProps.roleId);
    });
  });
});



