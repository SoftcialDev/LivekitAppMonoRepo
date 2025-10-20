/**
 * @fileoverview ContactManagerProfile - unit tests
 * @summary Tests for ContactManagerProfile domain entity functionality
 * @description Validates ContactManagerProfile entity business logic and state management
 */

import { ContactManagerProfile } from '../../../../../shared/domain/entities/ContactManagerProfile';

// Mock ContactManagerStatus since it's not available in test environment
const ContactManagerStatus = {
  Available: 'Available',
  Unavailable: 'Unavailable',
  OnBreak: 'OnBreak',
  OnAnotherTask: 'OnAnotherTask'
} as const;

// Mock the ContactManagerStatus import in the actual file
jest.mock('@prisma/client', () => ({
  ContactManagerStatus: {
    Available: 'Available',
    Unavailable: 'Unavailable',
    OnBreak: 'OnBreak',
    OnAnotherTask: 'OnAnotherTask'
  }
}));

describe('ContactManagerProfile', () => {
  describe('constructor', () => {
    it('should create profile with all properties', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        user: {
          email: 'manager@example.com',
          fullName: 'John Manager'
        }
      });

      expect(profile.id).toBe('profile-123');
      expect(profile.userId).toBe('user-123');
      expect(profile.status).toBe(ContactManagerStatus.Available);
      expect(profile.user?.email).toBe('manager@example.com');
      expect(profile.user?.fullName).toBe('John Manager');
    });

    it('should create profile without user data', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z')
      });

      expect(profile.id).toBe('profile-123');
      expect(profile.userId).toBe('user-123');
      expect(profile.status).toBe(ContactManagerStatus.Available);
      expect(profile.user).toBeUndefined();
    });
  });

  describe('fromPrisma', () => {
    it('should create profile from Prisma model with user', () => {
      const prismaProfile = {
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        user: {
          email: 'manager@example.com',
          fullName: 'John Manager'
        }
      };

      const profile = ContactManagerProfile.fromPrisma(prismaProfile);

      expect(profile.id).toBe('profile-123');
      expect(profile.userId).toBe('user-123');
      expect(profile.status).toBe(ContactManagerStatus.Available);
      expect(profile.user?.email).toBe('manager@example.com');
      expect(profile.user?.fullName).toBe('John Manager');
    });

    it('should create profile from Prisma model without user', () => {
      const prismaProfile = {
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        user: null
      };

      const profile = ContactManagerProfile.fromPrisma(prismaProfile);

      expect(profile.id).toBe('profile-123');
      expect(profile.userId).toBe('user-123');
      expect(profile.status).toBe(ContactManagerStatus.Available);
      expect(profile.user).toBeUndefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isAvailable()).toBe(true);
    });

    it('should return false for other statuses', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isAvailable()).toBe(false);
    });
  });

  describe('isUnavailable', () => {
    it('should return true for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isUnavailable()).toBe(true);
    });

    it('should return false for other statuses', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isUnavailable()).toBe(false);
    });
  });

  describe('isOnBreak', () => {
    it('should return true for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isOnBreak()).toBe(true);
    });

    it('should return false for other statuses', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isOnBreak()).toBe(false);
    });
  });

  describe('isOnAnotherTask', () => {
    it('should return true for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnAnotherTask,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isOnAnotherTask()).toBe(true);
    });

    it('should return false for other statuses', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isOnAnotherTask()).toBe(false);
    });
  });

  describe('isBusy', () => {
    it('should return true for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isBusy()).toBe(true);
    });

    it('should return true for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnAnotherTask,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isBusy()).toBe(true);
    });

    it('should return false for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isBusy()).toBe(false);
    });

    it('should return false for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isBusy()).toBe(false);
    });
  });

  describe('canTakeRequests', () => {
    it('should return true for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.canTakeRequests()).toBe(true);
    });

    it('should return false for other statuses', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.canTakeRequests()).toBe(false);
    });
  });

  describe('getStatusString', () => {
    it('should return "Available" for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusString()).toBe('Available');
    });

    it('should return "Unavailable" for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusString()).toBe('Unavailable');
    });

    it('should return "On Break" for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusString()).toBe('On Break');
    });

    it('should return "On Another Task" for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnAnotherTask,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusString()).toBe('On Another Task');
    });

    it('should return "Unknown" for unknown status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: 'Unknown' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusString()).toBe('Unknown');
    });
  });

  describe('getStatusColor', () => {
    it('should return "green" for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusColor()).toBe('green');
    });

    it('should return "red" for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusColor()).toBe('red');
    });

    it('should return "yellow" for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusColor()).toBe('yellow');
    });

    it('should return "orange" for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnAnotherTask,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusColor()).toBe('orange');
    });

    it('should return "gray" for unknown status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: 'Unknown' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getStatusColor()).toBe('gray');
    });
  });

  describe('wasCreatedRecently', () => {
    it('should return true for recently created profile', () => {
      const now = new Date();
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: now,
        updatedAt: now
      });

      expect(profile.wasCreatedRecently()).toBe(true);
    });

    it('should return false for old profile', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
      });

      expect(profile.wasCreatedRecently()).toBe(false);
    });

    it('should use custom max hours', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
      });

      expect(profile.wasCreatedRecently(48)).toBe(true); // 48 hours
    });
  });

  describe('wasUpdatedRecently', () => {
    it('should return true for recently updated profile', () => {
      const now = new Date();
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: now
      });

      expect(profile.wasUpdatedRecently()).toBe(true);
    });

    it('should return false for old update', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: oneHourAgo
      });

      expect(profile.wasUpdatedRecently()).toBe(false);
    });

    it('should use custom max minutes', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: oneHourAgo
      });

      expect(profile.wasUpdatedRecently(120)).toBe(true); // 120 minutes
    });
  });

  describe('isInWorkingState', () => {
    it('should return true for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInWorkingState()).toBe(true);
    });

    it('should return true for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnAnotherTask,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInWorkingState()).toBe(true);
    });

    it('should return false for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInWorkingState()).toBe(false);
    });

    it('should return false for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInWorkingState()).toBe(false);
    });
  });

  describe('isInNonWorkingState', () => {
    it('should return true for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInNonWorkingState()).toBe(true);
    });

    it('should return true for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInNonWorkingState()).toBe(true);
    });

    it('should return false for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInNonWorkingState()).toBe(false);
    });

    it('should return false for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnAnotherTask,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.isInNonWorkingState()).toBe(false);
    });
  });

  describe('getAssignmentPriority', () => {
    it('should return 1 for Available status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getAssignmentPriority()).toBe(1);
    });

    it('should return 2 for OnAnotherTask status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnAnotherTask,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getAssignmentPriority()).toBe(2);
    });

    it('should return 3 for OnBreak status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.OnBreak,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getAssignmentPriority()).toBe(3);
    });

    it('should return 4 for Unavailable status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Unavailable,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getAssignmentPriority()).toBe(4);
    });

    it('should return 5 for unknown status', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: 'Unknown' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(profile.getAssignmentPriority()).toBe(5);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const profile = new ContactManagerProfile({
        id: 'profile-123',
        userId: 'user-123',
        status: ContactManagerStatus.Available,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z')
      });

      const payload = profile.toPayload();

      expect(payload.id).toBe('profile-123');
      expect(payload.userId).toBe('user-123');
      expect(payload.status).toBe(ContactManagerStatus.Available);
      expect(payload.createdAt).toBe('2023-01-01T10:00:00.000Z');
      expect(payload.updatedAt).toBe('2023-01-01T10:00:00.000Z');
    });
  });
});
