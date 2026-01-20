import { ContactManagerProfile } from '../../../src/domain/entities/ContactManagerProfile';
import { ContactManagerStatus } from '@prisma/client';

describe('ContactManagerProfile', () => {
  const baseProps = {
    id: 'profile-id',
    userId: 'user-id',
    status: ContactManagerStatus.Available,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('isAvailable', () => {
    it('should return true when status is Available', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.isAvailable()).toBe(true);
    });

    it('should return false when status is not Available', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.isAvailable()).toBe(false);
    });
  });

  describe('isUnavailable', () => {
    it('should return true when status is Unavailable', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.isUnavailable()).toBe(true);
    });
  });

  describe('isOnBreak', () => {
    it('should return true when status is OnBreak', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnBreak,
      });

      expect(profile.isOnBreak()).toBe(true);
    });
  });

  describe('isOnAnotherTask', () => {
    it('should return true when status is OnAnotherTask', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnAnotherTask,
      });

      expect(profile.isOnAnotherTask()).toBe(true);
    });
  });

  describe('isBusy', () => {
    it('should return true when on break', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnBreak,
      });

      expect(profile.isBusy()).toBe(true);
    });

    it('should return true when on another task', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnAnotherTask,
      });

      expect(profile.isBusy()).toBe(true);
    });

    it('should return false when available', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.isBusy()).toBe(false);
    });
  });

  describe('canTakeRequests', () => {
    it('should return true when available', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.canTakeRequests()).toBe(true);
    });

    it('should return false when not available', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.canTakeRequests()).toBe(false);
    });
  });

  describe('getStatusString', () => {
    it('should return "Available" for Available status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.getStatusString()).toBe('Available');
    });

    it('should return "Unavailable" for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.getStatusString()).toBe('Unavailable');
    });

    it('should return "On Break" for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnBreak,
      });

      expect(profile.getStatusString()).toBe('On Break');
    });

    it('should return "On Another Task" for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnAnotherTask,
      });

      expect(profile.getStatusString()).toBe('On Another Task');
    });

    it('should return "Unknown" for unknown status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: 'UNKNOWN' as any,
      });

      expect(profile.getStatusString()).toBe('Unknown');
    });
  });

  describe('getStatusColor', () => {
    it('should return "green" for Available status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.getStatusColor()).toBe('green');
    });

    it('should return "red" for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.getStatusColor()).toBe('red');
    });

    it('should return "yellow" for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnBreak,
      });

      expect(profile.getStatusColor()).toBe('yellow');
    });

    it('should return "orange" for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnAnotherTask,
      });

      expect(profile.getStatusColor()).toBe('orange');
    });

    it('should return "gray" for unknown status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: 'UNKNOWN' as any,
      });

      expect(profile.getStatusColor()).toBe('gray');
    });
  });

  describe('wasCreatedRecently', () => {
    it('should return true when created recently', () => {
      const createdAt = new Date(Date.now() - 3600000); // 1 hour ago
      const profile = new ContactManagerProfile({
        ...baseProps,
        createdAt,
      });

      expect(profile.wasCreatedRecently(24)).toBe(true);
    });

    it('should return false when created long ago', () => {
      const createdAt = new Date(Date.now() - 86400000 * 2); // 2 days ago
      const profile = new ContactManagerProfile({
        ...baseProps,
        createdAt,
      });

      expect(profile.wasCreatedRecently(24)).toBe(false);
    });
  });

  describe('wasUpdatedRecently', () => {
    it('should return true when updated recently', () => {
      const updatedAt = new Date(Date.now() - 300000); // 5 minutes ago
      const profile = new ContactManagerProfile({
        ...baseProps,
        updatedAt,
      });

      expect(profile.wasUpdatedRecently(10)).toBe(true);
    });

    it('should return false when updated long ago', () => {
      const updatedAt = new Date(Date.now() - 720000); // 12 minutes ago
      const profile = new ContactManagerProfile({
        ...baseProps,
        updatedAt,
      });

      expect(profile.wasUpdatedRecently(10)).toBe(false);
    });
  });

  describe('isInWorkingState', () => {
    it('should return true when available', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.isInWorkingState()).toBe(true);
    });

    it('should return true when on another task', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnAnotherTask,
      });

      expect(profile.isInWorkingState()).toBe(true);
    });

    it('should return false when unavailable', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.isInWorkingState()).toBe(false);
    });

    it('should return false when on break', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnBreak,
      });

      expect(profile.isInWorkingState()).toBe(false);
    });
  });

  describe('isInNonWorkingState', () => {
    it('should return true when unavailable', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.isInNonWorkingState()).toBe(true);
    });

    it('should return true when on break', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnBreak,
      });

      expect(profile.isInNonWorkingState()).toBe(true);
    });

    it('should return false when available', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.isInNonWorkingState()).toBe(false);
    });
  });

  describe('getAssignmentPriority', () => {
    it('should return 1 for Available status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Available,
      });

      expect(profile.getAssignmentPriority()).toBe(1);
    });

    it('should return 2 for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnAnotherTask,
      });

      expect(profile.getAssignmentPriority()).toBe(2);
    });

    it('should return 3 for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.OnBreak,
      });

      expect(profile.getAssignmentPriority()).toBe(3);
    });

    it('should return 4 for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: ContactManagerStatus.Unavailable,
      });

      expect(profile.getAssignmentPriority()).toBe(4);
    });

    it('should return 5 for unknown status', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
        status: 'UNKNOWN' as any,
      });

      expect(profile.getAssignmentPriority()).toBe(5);
    });
  });

  describe('toPayload', () => {
    it('should return payload with all fields', () => {
      const profile = new ContactManagerProfile({
        ...baseProps,
      });

      const payload = profile.toPayload();
      expect(payload.id).toBe('profile-id');
      expect(payload.userId).toBe('user-id');
      expect(payload.status).toBe(ContactManagerStatus.Available);
      expect(payload.createdAt).toBe(baseProps.createdAt.toISOString());
      expect(payload.updatedAt).toBe(baseProps.updatedAt.toISOString());
    });
  });
});





