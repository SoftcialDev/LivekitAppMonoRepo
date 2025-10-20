/**
 * @fileoverview RecordingSession entity - unit tests
 */

// Mock RecordingStatus enum globally
jest.mock('@prisma/client', () => ({
  RecordingStatus: {
    Active: 'Active',
    Completed: 'Completed',
    Failed: 'Failed'
  }
}));

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z'))
}));

import { RecordingSession } from '../../../../../shared/domain/entities/RecordingSession';
import { RecordingStatus } from '@prisma/client';

describe('RecordingSession', () => {
  const baseSessionData = {
    id: 'session123',
    roomName: 'room123',
    roomId: 'room-id-123',
    egressId: 'egress123',
    userId: 'user123',
    subjectUserId: 'subject123',
    subjectLabel: 'Test Subject',
    status: RecordingStatus.Active,
    startedAt: new Date('2023-01-01T10:00:00Z'),
    stoppedAt: null,
    blobUrl: null,
    blobPath: null,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z')
  };

  describe('constructor', () => {
    it('creates session with all required properties', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(session.id).toBe('session123');
      expect(session.roomName).toBe('room123');
      expect(session.roomId).toBe('room-id-123');
      expect(session.egressId).toBe('egress123');
      expect(session.userId).toBe('user123');
      expect(session.subjectUserId).toBe('subject123');
      expect(session.subjectLabel).toBe('Test Subject');
      expect(session.status).toBe(RecordingStatus.Active);
      expect(session.startedAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(session.stoppedAt).toBeNull();
      expect(session.blobUrl).toBeNull();
      expect(session.blobPath).toBeNull();
    });

    it('creates session with optional user details', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z'),
        {
          email: 'test@example.com',
          fullName: 'Test User'
        }
      );
      
      expect(session.user).toEqual({
        email: 'test@example.com',
        fullName: 'Test User'
      });
    });
  });

  describe('fromPrisma', () => {
    it('creates session from Prisma data without user', () => {
      const prismaSession = {
        id: 'session123',
        roomName: 'room123',
        roomId: 'room-id-123',
        egressId: 'egress123',
        userId: 'user123',
        subjectUserId: 'subject123',
        subjectLabel: 'Test Subject',
        status: RecordingStatus.Active,
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };

      const session = RecordingSession.fromPrisma(prismaSession);
      
      expect(session.id).toBe('session123');
      expect(session.roomName).toBe('room123');
      expect(session.status).toBe(RecordingStatus.Active);
      expect(session.user).toBeUndefined();
    });

    it('creates session from Prisma data with user', () => {
      const prismaSession = {
        id: 'session123',
        roomName: 'room123',
        roomId: 'room-id-123',
        egressId: 'egress123',
        userId: 'user123',
        subjectUserId: 'subject123',
        subjectLabel: 'Test Subject',
        status: RecordingStatus.Active,
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        user: {
          email: 'test@example.com',
          fullName: 'Test User'
        }
      };

      const session = RecordingSession.fromPrisma(prismaSession);
      
      expect(session.user).toEqual({
        email: 'test@example.com',
        fullName: 'Test User'
      });
    });

    it('handles null startedAt by using current time', () => {
      const prismaSession = {
        id: 'session123',
        roomName: 'room123',
        roomId: 'room-id-123',
        egressId: 'egress123',
        userId: 'user123',
        subjectUserId: 'subject123',
        subjectLabel: 'Test Subject',
        status: RecordingStatus.Active,
        startedAt: null,
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };

      const session = RecordingSession.fromPrisma(prismaSession);
      expect(session.startedAt).toEqual(new Date('2023-01-01T12:00:00Z')); // Current time
    });

    it('handles null stoppedAt in fromPrisma', () => {
      const prismaSession = {
        id: 'session123',
        roomName: 'room123',
        roomId: 'room-id-123',
        egressId: 'egress123',
        userId: 'user123',
        subjectUserId: 'subject123',
        subjectLabel: 'Test Subject',
        status: RecordingStatus.Active,
        startedAt: new Date('2023-01-01T10:00:00Z'),
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };

      const session = RecordingSession.fromPrisma(prismaSession);
      expect(session.stoppedAt).toBeNull();
    });
  });

  describe('status checks', () => {
    it('isActive returns true for Active status', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(session.isActive()).toBe(true);
    });

    it('isActive returns false for other statuses', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Completed,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(session.isActive()).toBe(false);
    });

    it('isCompleted returns true for Completed status', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Completed,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(session.isCompleted()).toBe(true);
    });

    it('isFailed returns true for Failed status', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Failed,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(session.isFailed()).toBe(true);
    });
  });

  describe('duration calculation', () => {
    it('getDuration returns 0 for invalid dates', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('invalid'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(session.getDuration()).toBe(0);
    });

    it('getDuration returns duration in seconds for active recording', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T10:00:00Z'), // 2 hours ago
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      const duration = session.getDuration();
      expect(duration).toBe(2 * 60 * 60); // 2 hours in seconds
    });

    it('getDuration returns duration in seconds for completed recording', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Completed,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z'), // 1 hour duration
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      const duration = session.getDuration();
      expect(duration).toBe(60 * 60); // 1 hour in seconds
    });

    it('getDuration returns 0 for negative duration', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T12:00:00Z'), // Future start time
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      const duration = session.getDuration();
      expect(duration).toBe(0);
    });
  });

  describe('toPayload', () => {
    it('converts session to payload format', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T10:00:00Z'),
        null,
        'https://blob.example.com/recording.mp4',
        'recordings/recording.mp4',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z'),
        {
          email: 'test@example.com',
          fullName: 'Test User'
        }
      );
      
      const payload = session.toPayload();
      
      expect(payload).toEqual({
        id: 'session123',
        roomName: 'room123',
        roomId: 'room-id-123',
        egressId: 'egress123',
        userId: 'user123',
        status: RecordingStatus.Active,
        startedAt: '2023-01-01T10:00:00.000Z',
        stoppedAt: null,
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T11:00:00.000Z',
        username: 'Test User',
        recordedBy: 'Test User',
        blobPath: 'recordings/recording.mp4',
        blobUrl: 'https://blob.example.com/recording.mp4',
        duration: 7200 // 2 hours in seconds
      });
    });

    it('handles session without user details', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      const payload = session.toPayload();
      
      expect(payload.username).toBeUndefined();
      expect(payload.recordedBy).toBeUndefined();
    });

    it('handles session with stoppedAt date', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Completed,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z'),
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      const payload = session.toPayload();
      
      expect(payload.stoppedAt).toBe('2023-01-01T11:00:00.000Z');
    });

    it('handles session with null updatedAt', () => {
      const session = new RecordingSession(
        'session123',
        'room123',
        'room-id-123',
        'egress123',
        'user123',
        'subject123',
        'Test Subject',
        RecordingStatus.Active,
        new Date('2023-01-01T10:00:00Z'),
        null,
        null,
        null,
        new Date('2023-01-01T10:00:00Z'),
        null as any // Force null updatedAt
      );
      
      const payload = session.toPayload();
      
      expect(payload.updatedAt).toBeNull();
    });
  });
});
