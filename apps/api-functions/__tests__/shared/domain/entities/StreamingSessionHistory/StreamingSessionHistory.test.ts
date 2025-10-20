/**
 * @fileoverview StreamingSessionHistory entity tests
 * @summary Unit tests for StreamingSessionHistory domain entity
 */

import { StreamingSessionHistory } from '../../../../../shared/domain/entities/StreamingSessionHistory';

describe('StreamingSessionHistory', () => {
  const mockDate = new Date('2024-01-15T10:00:00Z');
  const mockStoppedDate = new Date('2024-01-15T12:00:00Z');

  describe('constructor', () => {
    it('should create StreamingSessionHistory with all properties', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'COMMAND',
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          email: 'test@example.com',
          id: 'user-1'
        }
      });

      expect(session.id).toBe('session-1');
      expect(session.userId).toBe('user-1');
      expect(session.startedAt).toBe(mockDate);
      expect(session.stoppedAt).toBe(mockStoppedDate);
      expect(session.stopReason).toBe('COMMAND');
      expect(session.createdAt).toBe(mockDate);
      expect(session.updatedAt).toBe(mockDate);
      expect(session.user).toEqual({
        email: 'test@example.com',
        id: 'user-1'
      });
    });

    it('should create StreamingSessionHistory with null values', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.stoppedAt).toBeNull();
      expect(session.stopReason).toBeNull();
      expect(session.user).toBeUndefined();
    });
  });

  describe('fromPrisma', () => {
    it('should create StreamingSessionHistory from Prisma model', () => {
      const prismaSession = {
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'COMMAND',
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          email: 'test@example.com',
          id: 'user-1'
        }
      };

      const session = StreamingSessionHistory.fromPrisma(prismaSession);

      expect(session.id).toBe('session-1');
      expect(session.userId).toBe('user-1');
      expect(session.startedAt).toBe(mockDate);
      expect(session.stoppedAt).toBe(mockStoppedDate);
      expect(session.stopReason).toBe('COMMAND');
      expect(session.user).toEqual({
        email: 'test@example.com',
        id: 'user-1'
      });
    });

    it('should create StreamingSessionHistory from Prisma model without user', () => {
      const prismaSession = {
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: null
      };

      const session = StreamingSessionHistory.fromPrisma(prismaSession);

      expect(session.user).toBeUndefined();
      expect(session.stoppedAt).toBeNull();
      expect(session.stopReason).toBeNull();
    });
  });

  describe('isActive', () => {
    it('should return true when stoppedAt is null', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.isActive()).toBe(true);
    });

    it('should return false when stoppedAt is not null', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.isActive()).toBe(false);
    });
  });

  describe('isStopped', () => {
    it('should return true when stoppedAt is not null', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.isStopped()).toBe(true);
    });

    it('should return false when stoppedAt is null', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.isStopped()).toBe(false);
    });
  });

  describe('getDuration', () => {
    it('should return null for active session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getDuration()).toBeNull();
    });

    it('should return duration in milliseconds for stopped session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      const expectedDuration = mockStoppedDate.getTime() - mockDate.getTime();
      expect(session.getDuration()).toBe(expectedDuration);
    });
  });

  describe('getDurationInMinutes', () => {
    it('should return null for active session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getDurationInMinutes()).toBeNull();
    });

    it('should return duration in minutes for stopped session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      const expectedMinutes = Math.floor((mockStoppedDate.getTime() - mockDate.getTime()) / (1000 * 60));
      expect(session.getDurationInMinutes()).toBe(expectedMinutes);
    });
  });

  describe('getDurationInHours', () => {
    it('should return null for active session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getDurationInHours()).toBeNull();
    });

    it('should return duration in hours for stopped session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      const expectedHours = Math.floor((mockStoppedDate.getTime() - mockDate.getTime()) / (1000 * 60 * 60));
      expect(session.getDurationInHours()).toBe(expectedHours);
    });
  });

  describe('wasStoppedByCommand', () => {
    it('should return true when stopReason is COMMAND', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'COMMAND',
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.wasStoppedByCommand()).toBe(true);
    });

    it('should return false when stopReason is not COMMAND', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'DISCONNECT',
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.wasStoppedByCommand()).toBe(false);
    });
  });

  describe('wasStoppedByDisconnection', () => {
    it('should return true when stopReason is DISCONNECT', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'DISCONNECT',
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.wasStoppedByDisconnection()).toBe(true);
    });

    it('should return false when stopReason is not DISCONNECT', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'COMMAND',
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.wasStoppedByDisconnection()).toBe(false);
    });
  });

  describe('isLongSession', () => {
    it('should return true when session is longer than max hours', () => {
      const longSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(mockDate.getTime() + 10 * 60 * 60 * 1000), // 10 hours
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(longSession.isLongSession(8)).toBe(true);
    });

    it('should return false when session is shorter than max hours', () => {
      const shortSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(mockDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(shortSession.isLongSession(8)).toBe(false);
    });

    it('should return false for active session', () => {
      const activeSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(activeSession.isLongSession(8)).toBe(false);
    });

    it('should return false when duration is null', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.isLongSession(8)).toBe(false);
    });
  });

  describe('isShortSession', () => {
    it('should return true when session is shorter than min minutes', () => {
      const shortSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(mockDate.getTime() + 2 * 60 * 1000), // 2 minutes
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(shortSession.isShortSession(5)).toBe(true);
    });

    it('should return false when session is longer than min minutes', () => {
      const longSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(mockDate.getTime() + 10 * 60 * 1000), // 10 minutes
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(longSession.isShortSession(5)).toBe(false);
    });

    it('should return false for active session', () => {
      const activeSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(activeSession.isShortSession(5)).toBe(false);
    });

    it('should return false when duration is null', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.isShortSession(5)).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return ACTIVE for active session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getStatus()).toBe('ACTIVE');
    });

    it('should return STOPPED_BY_COMMAND for command-stopped session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'COMMAND',
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getStatus()).toBe('STOPPED_BY_COMMAND');
    });

    it('should return STOPPED_BY_DISCONNECTION for disconnect-stopped session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'DISCONNECT',
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getStatus()).toBe('STOPPED_BY_DISCONNECTION');
    });

    it('should return STOPPED for other stopped session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: mockStoppedDate,
        stopReason: 'OTHER',
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getStatus()).toBe('STOPPED');
    });
  });

  describe('getDurationString', () => {
    it('should return Active for active session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getDurationString()).toBe('Active');
    });

    it('should return hours and minutes for long session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(mockDate.getTime() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000), // 2h 30m
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getDurationString()).toBe('2h 30m');
    });

    it('should return minutes only for short session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(mockDate.getTime() + 30 * 60 * 1000), // 30 minutes
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getDurationString()).toBe('30m');
    });

    it('should return Less than 1 minute for very short session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(mockDate.getTime() + 30 * 1000), // 30 seconds
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(session.getDurationString()).toBe('Less than 1 minute');
    });
  });

  describe('startedRecently', () => {
    it('should return true when session started within max minutes', () => {
      const recentSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(recentSession.startedRecently(5)).toBe(true);
    });

    it('should return false when session started beyond max minutes', () => {
      const oldSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(oldSession.startedRecently(5)).toBe(false);
    });
  });

  describe('stoppedRecently', () => {
    it('should return true when session stopped within max minutes', () => {
      const recentSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(recentSession.stoppedRecently(5)).toBe(true);
    });

    it('should return false when session stopped beyond max minutes', () => {
      const oldSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(oldSession.stoppedRecently(5)).toBe(false);
    });

    it('should return false for active session', () => {
      const activeSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: mockDate,
        stoppedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(activeSession.stoppedRecently(5)).toBe(false);
    });
  });

  describe('startedRecently', () => {
    it('should return true when session started within max minutes', () => {
      const recentSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(recentSession.startedRecently(5)).toBe(true);
    });

    it('should return false when session started beyond max minutes', () => {
      const oldSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(oldSession.startedRecently(5)).toBe(false);
    });

    it('should use default max minutes when not specified', () => {
      const recentSession = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        createdAt: mockDate,
        updatedAt: mockDate
      });

      expect(recentSession.startedRecently()).toBe(true);
    });
  });
});
