import { RecordingSession } from '../../../src/domain/entities/RecordingSession';
import { RecordingStatus } from '@prisma/client';

describe('RecordingSession', () => {
  describe('parseStartedAt', () => {
    it('should return current time when startedAt is null', () => {
      const session = RecordingSession.fromPrisma({
        id: 'session-id',
        roomName: 'room-1',
        roomId: null,
        egressId: 'egress-1',
        userId: 'user-id',
        subjectUserId: null,
        subjectLabel: null,
        status: RecordingStatus.Active,
        startedAt: null,
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(session.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('parseStoppedAt', () => {
    it('should parse stoppedAt from string', () => {
      const stoppedAt = '2024-01-01T11:00:00Z';
      const session = RecordingSession.fromPrisma({
        id: 'session-id',
        roomName: 'room-1',
        roomId: null,
        egressId: 'egress-1',
        userId: 'user-id',
        subjectUserId: null,
        subjectLabel: null,
        status: RecordingStatus.Completed,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: stoppedAt,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(session.stoppedAt).toBeInstanceOf(Date);
      expect(session.stoppedAt?.toISOString()).toBe(new Date(stoppedAt).toISOString());
    });

    it('should return null when stoppedAt is null', () => {
      const session = RecordingSession.fromPrisma({
        id: 'session-id',
        roomName: 'room-1',
        roomId: null,
        egressId: 'egress-1',
        userId: 'user-id',
        subjectUserId: null,
        subjectLabel: null,
        status: RecordingStatus.Active,
        startedAt: new Date(),
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(session.stoppedAt).toBeNull();
    });

    it('should return Date when stoppedAt is already a Date', () => {
      const stoppedAtDate = new Date('2024-01-01T11:00:00Z');
      const session = RecordingSession.fromPrisma({
        id: 'session-id',
        roomName: 'room-1',
        roomId: null,
        egressId: 'egress-1',
        userId: 'user-id',
        subjectUserId: null,
        subjectLabel: null,
        status: RecordingStatus.Completed,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: stoppedAtDate,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(session.stoppedAt).toBeInstanceOf(Date);
      expect(session.stoppedAt?.getTime()).toBe(stoppedAtDate.getTime());
    });
  });

  describe('isActive, isCompleted, isFailed', () => {
    it('should return true for isActive when status is Active', () => {
      const session = RecordingSession.fromPrisma({
        id: 'session-id',
        roomName: 'room-1',
        roomId: null,
        egressId: 'egress-1',
        userId: 'user-id',
        subjectUserId: null,
        subjectLabel: null,
        status: RecordingStatus.Active,
        startedAt: new Date(),
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(session.isActive()).toBe(true);
      expect(session.isCompleted()).toBe(false);
      expect(session.isFailed()).toBe(false);
    });
  });
});


