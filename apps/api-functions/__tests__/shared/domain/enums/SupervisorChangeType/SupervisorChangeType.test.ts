/**
 * @fileoverview SupervisorChangeType enum - unit tests
 * @summary Tests for supervisor change type enumeration
 * @description Validates enum values, string representations, and supervisor change operations
 */

import { SupervisorChangeType } from '../../../../../shared/domain/enums/SupervisorChangeType';

describe('SupervisorChangeType', () => {
  describe('enum values', () => {
    it('should have ASSIGN value', () => {
      expect(SupervisorChangeType.ASSIGN).toBe('ASSIGN');
    });

    it('should have UNASSIGN value', () => {
      expect(SupervisorChangeType.UNASSIGN).toBe('UNASSIGN');
    });

    it('should have SUPERVISOR_CHANGED value', () => {
      expect(SupervisorChangeType.SUPERVISOR_CHANGED).toBe('SUPERVISOR_CHANGED');
    });
  });

  describe('enum properties', () => {
    it('should have correct number of enum values', () => {
      const enumValues = Object.values(SupervisorChangeType);
      expect(enumValues).toHaveLength(3);
    });

    it('should contain all expected values', () => {
      const enumValues = Object.values(SupervisorChangeType);
      expect(enumValues).toContain('ASSIGN');
      expect(enumValues).toContain('UNASSIGN');
      expect(enumValues).toContain('SUPERVISOR_CHANGED');
    });
  });

  describe('enum usage', () => {
    it('should be usable in conditional statements', () => {
      const changeType = SupervisorChangeType.ASSIGN;
      let result: string;

      if (changeType === SupervisorChangeType.ASSIGN) {
        result = 'assigning';
      } else if (changeType === SupervisorChangeType.UNASSIGN) {
        result = 'unassigning';
      } else if (changeType === SupervisorChangeType.SUPERVISOR_CHANGED) {
        result = 'changing';
      } else {
        result = 'unknown';
      }

      expect(result).toBe('assigning');
    });

    it('should be comparable with string values', () => {
      expect(SupervisorChangeType.ASSIGN === 'ASSIGN').toBe(true);
      expect(SupervisorChangeType.UNASSIGN === 'UNASSIGN').toBe(true);
      expect(SupervisorChangeType.SUPERVISOR_CHANGED === 'SUPERVISOR_CHANGED').toBe(true);
    });

    it('should be usable in object keys', () => {
      const changeTypeMap = {
        [SupervisorChangeType.ASSIGN]: 'Assigning supervisor',
        [SupervisorChangeType.UNASSIGN]: 'Unassigning supervisor',
        [SupervisorChangeType.SUPERVISOR_CHANGED]: 'Changing supervisor'
      };

      expect(changeTypeMap[SupervisorChangeType.ASSIGN]).toBe('Assigning supervisor');
      expect(changeTypeMap[SupervisorChangeType.UNASSIGN]).toBe('Unassigning supervisor');
      expect(changeTypeMap[SupervisorChangeType.SUPERVISOR_CHANGED]).toBe('Changing supervisor');
    });
  });

  describe('supervisor change functionality', () => {
    it('should support change type validation', () => {
      const isValidChangeType = (changeType: string): boolean => {
        return Object.values(SupervisorChangeType).includes(changeType as SupervisorChangeType);
      };

      expect(isValidChangeType('ASSIGN')).toBe(true);
      expect(isValidChangeType('UNASSIGN')).toBe(true);
      expect(isValidChangeType('SUPERVISOR_CHANGED')).toBe(true);
      expect(isValidChangeType('INVALID')).toBe(false);
    });

    it('should support change type categorization', () => {
      const isAssignmentOperation = (changeType: SupervisorChangeType): boolean => {
        return changeType === SupervisorChangeType.ASSIGN;
      };

      const isUnassignmentOperation = (changeType: SupervisorChangeType): boolean => {
        return changeType === SupervisorChangeType.UNASSIGN;
      };

      const isChangeOperation = (changeType: SupervisorChangeType): boolean => {
        return changeType === SupervisorChangeType.SUPERVISOR_CHANGED;
      };

      expect(isAssignmentOperation(SupervisorChangeType.ASSIGN)).toBe(true);
      expect(isAssignmentOperation(SupervisorChangeType.UNASSIGN)).toBe(false);
      expect(isUnassignmentOperation(SupervisorChangeType.UNASSIGN)).toBe(true);
      expect(isUnassignmentOperation(SupervisorChangeType.ASSIGN)).toBe(false);
      expect(isChangeOperation(SupervisorChangeType.SUPERVISOR_CHANGED)).toBe(true);
      expect(isChangeOperation(SupervisorChangeType.ASSIGN)).toBe(false);
    });

    it('should support audit logging categorization', () => {
      const getAuditCategory = (changeType: SupervisorChangeType): string => {
        switch (changeType) {
          case SupervisorChangeType.ASSIGN:
            return 'supervisor_assignment';
          case SupervisorChangeType.UNASSIGN:
            return 'supervisor_unassignment';
          case SupervisorChangeType.SUPERVISOR_CHANGED:
            return 'supervisor_change';
          default:
            return 'unknown';
        }
      };

      expect(getAuditCategory(SupervisorChangeType.ASSIGN)).toBe('supervisor_assignment');
      expect(getAuditCategory(SupervisorChangeType.UNASSIGN)).toBe('supervisor_unassignment');
      expect(getAuditCategory(SupervisorChangeType.SUPERVISOR_CHANGED)).toBe('supervisor_change');
    });
  });

  describe('type safety', () => {
    it('should accept valid enum values', () => {
      const validChangeTypes: SupervisorChangeType[] = [
        SupervisorChangeType.ASSIGN,
        SupervisorChangeType.UNASSIGN,
        SupervisorChangeType.SUPERVISOR_CHANGED
      ];

      expect(validChangeTypes).toHaveLength(3);
    });

    it('should be serializable to JSON', () => {
      const changeType = SupervisorChangeType.ASSIGN;
      const json = JSON.stringify({ changeType });
      const parsed = JSON.parse(json);

      expect(parsed.changeType).toBe('ASSIGN');
    });
  });
});
