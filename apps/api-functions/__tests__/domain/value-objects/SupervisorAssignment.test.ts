import { SupervisorAssignment } from '../../../src/domain/value-objects/SupervisorAssignment';
import { SupervisorChangeType } from '../../../src/domain/enums/SupervisorChangeType';

describe('SupervisorAssignment', () => {
  describe('toPayload', () => {
    it('should convert assignment to payload format', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
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
        timestamp: timestamp.toISOString()
      });
    });

    it('should handle unassign operation', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        null,
        timestamp
      );
      const payload = assignment.toPayload();

      expect(payload.changeType).toBe(SupervisorChangeType.UNASSIGN);
      expect(payload.newSupervisorEmail).toBeNull();
    });
  });
});


