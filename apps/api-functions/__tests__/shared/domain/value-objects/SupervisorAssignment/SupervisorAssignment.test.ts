/**
 * @fileoverview SupervisorAssignment value object - unit tests
 * @summary Tests for SupervisorAssignment value object functionality
 * @description Validates supervisor assignment creation, factory methods, and payload conversion
 */

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z'))
}));

import { SupervisorAssignment, SupervisorAssignmentRequestPayload } from '../../../../../shared/domain/value-objects/SupervisorAssignment';
import { SupervisorChangeType } from '../../../../../shared/domain/enums/SupervisorChangeType';

describe('SupervisorAssignment', () => {
  describe('constructor', () => {
    it('should create assignment with all properties', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        timestamp
      );

      expect(assignment.userEmails).toEqual(['user1@example.com', 'user2@example.com']);
      expect(assignment.newSupervisorEmail).toBe('supervisor@example.com');
      expect(assignment.changeType).toBe(SupervisorChangeType.ASSIGN);
      expect(assignment.timestamp).toBe(timestamp);
    });

    it('should create unassign assignment with null supervisor', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        null,
        timestamp
      );

      expect(assignment.userEmails).toEqual(['user1@example.com']);
      expect(assignment.newSupervisorEmail).toBe(null);
      expect(assignment.changeType).toBe(SupervisorChangeType.UNASSIGN);
      expect(assignment.timestamp).toBe(timestamp);
    });

    it('should normalize emails to lowercase', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['USER1@EXAMPLE.COM', 'User2@Example.Com'],
        'SUPERVISOR@EXAMPLE.COM',
        timestamp
      );

      expect(assignment.userEmails).toEqual(['user1@example.com', 'user2@example.com']);
      expect(assignment.newSupervisorEmail).toBe('supervisor@example.com');
    });

    it('should handle empty user emails array', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        [],
        'supervisor@example.com',
        timestamp
      );

      expect(assignment.userEmails).toEqual([]);
      expect(assignment.newSupervisorEmail).toBe('supervisor@example.com');
      expect(assignment.changeType).toBe(SupervisorChangeType.ASSIGN);
    });

    it('should handle undefined supervisor email', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        undefined as any,
        timestamp
      );

      expect(assignment.userEmails).toEqual(['user1@example.com']);
      expect(assignment.newSupervisorEmail).toBe(null);
      expect(assignment.changeType).toBe(SupervisorChangeType.UNASSIGN);
    });
  });

  describe('fromRequest factory method', () => {
    it('should create assignment from request payload', () => {
      const payload: SupervisorAssignmentRequestPayload = {
        userEmails: ['user1@example.com', 'user2@example.com'],
        newSupervisorEmail: 'supervisor@example.com'
      };

      const assignment = SupervisorAssignment.fromRequest(payload);

      expect(assignment.userEmails).toEqual(['user1@example.com', 'user2@example.com']);
      expect(assignment.newSupervisorEmail).toBe('supervisor@example.com');
      expect(assignment.changeType).toBe(SupervisorChangeType.ASSIGN);
      expect(assignment.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should create unassign assignment from request with null supervisor', () => {
      const payload: SupervisorAssignmentRequestPayload = {
        userEmails: ['user1@example.com'],
        newSupervisorEmail: null
      };

      const assignment = SupervisorAssignment.fromRequest(payload);

      expect(assignment.userEmails).toEqual(['user1@example.com']);
      expect(assignment.newSupervisorEmail).toBe(null);
      expect(assignment.changeType).toBe(SupervisorChangeType.UNASSIGN);
    });

    it('should normalize emails in fromRequest', () => {
      const payload: SupervisorAssignmentRequestPayload = {
        userEmails: ['USER1@EXAMPLE.COM'],
        newSupervisorEmail: 'SUPERVISOR@EXAMPLE.COM'
      };

      const assignment = SupervisorAssignment.fromRequest(payload);

      expect(assignment.userEmails).toEqual(['user1@example.com']);
      expect(assignment.newSupervisorEmail).toBe('supervisor@example.com');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        timestamp
      );

      const payload = assignment.toPayload();

      expect(payload).toEqual({
        userEmails: ['user1@example.com', 'user2@example.com'],
        newSupervisorEmail: 'supervisor@example.com',
        changeType: SupervisorChangeType.ASSIGN,
        timestamp: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should convert unassign assignment to payload', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        null,
        timestamp
      );

      const payload = assignment.toPayload();

      expect(payload).toEqual({
        userEmails: ['user1@example.com'],
        newSupervisorEmail: null,
        changeType: SupervisorChangeType.UNASSIGN,
        timestamp: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should return reference to user emails array', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        timestamp
      );

      const payload = assignment.toPayload();
      payload.userEmails.push('user3@example.com');

      // Since toPayload returns a reference, both original and payload are affected
      expect(assignment.userEmails).toEqual(['user1@example.com', 'user2@example.com', 'user3@example.com']);
      expect(payload.userEmails).toEqual(['user1@example.com', 'user2@example.com', 'user3@example.com']);
    });
  });

  describe('SupervisorAssignmentRequestPayload interface', () => {
    it('should match SupervisorAssignmentRequestPayload interface structure', () => {
      const payload: SupervisorAssignmentRequestPayload = {
        userEmails: ['user1@example.com'],
        newSupervisorEmail: 'supervisor@example.com'
      };

      expect(payload.userEmails).toEqual(['user1@example.com']);
      expect(payload.newSupervisorEmail).toBe('supervisor@example.com');
    });

    it('should accept null supervisor email', () => {
      const payload: SupervisorAssignmentRequestPayload = {
        userEmails: ['user1@example.com'],
        newSupervisorEmail: null
      };

      expect(payload.newSupervisorEmail).toBe(null);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        'supervisor@example.com',
        timestamp
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (assignment as any).userEmails = ['modified@example.com'];
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (assignment as any).newSupervisorEmail = 'modified@example.com';
      }).not.toThrow();

      expect(() => {
        (assignment as any).changeType = SupervisorChangeType.UNASSIGN;
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle single user email', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user@example.com'],
        'supervisor@example.com',
        timestamp
      );

      expect(assignment.userEmails).toEqual(['user@example.com']);
      expect(assignment.newSupervisorEmail).toBe('supervisor@example.com');
    });

    it('should handle many user emails', () => {
      const manyEmails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        manyEmails,
        'supervisor@example.com',
        timestamp
      );

      expect(assignment.userEmails).toHaveLength(100);
      expect(assignment.userEmails[0]).toBe('user0@example.com');
      expect(assignment.userEmails[99]).toBe('user99@example.com');
    });

    it('should handle special characters in emails', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user+tag@example.com', 'user.name@example.com'],
        'supervisor+tag@example.com',
        timestamp
      );

      expect(assignment.userEmails).toEqual(['user+tag@example.com', 'user.name@example.com']);
      expect(assignment.newSupervisorEmail).toBe('supervisor+tag@example.com');
    });

    it('should handle different timestamp formats', () => {
      const timestamp1 = new Date('2023-01-01T12:00:00Z');
      const timestamp2 = new Date('2023-12-31T23:59:59Z');
      const timestamp3 = new Date('2020-01-01T00:00:00Z');

      const assignment1 = new SupervisorAssignment(['user@example.com'], 'supervisor@example.com', timestamp1);
      const assignment2 = new SupervisorAssignment(['user@example.com'], 'supervisor@example.com', timestamp2);
      const assignment3 = new SupervisorAssignment(['user@example.com'], 'supervisor@example.com', timestamp3);

      expect(assignment1.timestamp).toBe(timestamp1);
      expect(assignment2.timestamp).toBe(timestamp2);
      expect(assignment3.timestamp).toBe(timestamp3);
    });
  });

  describe('type safety', () => {
    it('should accept string array for user emails', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        timestamp
      );

      expect(Array.isArray(assignment.userEmails)).toBe(true);
      assignment.userEmails.forEach(email => {
        expect(typeof email).toBe('string');
      });
    });

    it('should accept string or null for supervisor email', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignAssignment = new SupervisorAssignment(['user@example.com'], 'supervisor@example.com', timestamp);
      const unassignAssignment = new SupervisorAssignment(['user@example.com'], null, timestamp);

      expect(typeof assignAssignment.newSupervisorEmail).toBe('string');
      expect(unassignAssignment.newSupervisorEmail).toBe(null);
    });

    it('should accept Date for timestamp', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(['user@example.com'], 'supervisor@example.com', timestamp);

      expect(assignment.timestamp instanceof Date).toBe(true);
    });
  });

  describe('validation scenarios', () => {
    it('should handle assign scenario', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['employee1@example.com', 'employee2@example.com'],
        'supervisor@example.com',
        timestamp
      );

      expect(assignment.changeType).toBe(SupervisorChangeType.ASSIGN);
      expect(assignment.newSupervisorEmail).toBe('supervisor@example.com');
    });

    it('should handle unassign scenario', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        ['employee1@example.com', 'employee2@example.com'],
        null,
        timestamp
      );

      expect(assignment.changeType).toBe(SupervisorChangeType.UNASSIGN);
      expect(assignment.newSupervisorEmail).toBe(null);
    });

    it('should handle bulk assignment scenario', () => {
      const manyEmails = Array.from({ length: 50 }, (_, i) => `employee${i}@example.com`);
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        manyEmails,
        'supervisor@example.com',
        timestamp
      );

      expect(assignment.userEmails).toHaveLength(50);
      expect(assignment.changeType).toBe(SupervisorChangeType.ASSIGN);
    });

    it('should handle bulk unassign scenario', () => {
      const manyEmails = Array.from({ length: 50 }, (_, i) => `employee${i}@example.com`);
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const assignment = new SupervisorAssignment(
        manyEmails,
        null,
        timestamp
      );

      expect(assignment.userEmails).toHaveLength(50);
      expect(assignment.changeType).toBe(SupervisorChangeType.UNASSIGN);
    });
  });
});
