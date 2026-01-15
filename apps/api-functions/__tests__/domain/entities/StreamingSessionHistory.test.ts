import { StreamingSessionHistory } from '../../../src/domain/entities/StreamingSessionHistory';

describe('StreamingSessionHistory', () => {
  const baseStartedAt = new Date('2024-01-01T10:00:00Z');
  const baseProps = {
    id: 'session-id',
    userId: 'user-id',
    startedAt: baseStartedAt,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('isActive', () => {
    it('should return true when stoppedAt is null', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.isActive()).toBe(true);
    });

    it('should return false when stoppedAt is not null', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
      });

      expect(session.isActive()).toBe(false);
    });
  });

  describe('isStopped', () => {
    it('should return true when stoppedAt is not null', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
      });

      expect(session.isStopped()).toBe(true);
    });

    it('should return false when stoppedAt is null', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.isStopped()).toBe(false);
    });
  });

  describe('getDuration', () => {
    it('should return null when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.getDuration()).toBeNull();
    });

    it('should return duration in milliseconds when stopped', () => {
      const stoppedAt = new Date('2024-01-01T10:30:00Z'); // 30 minutes later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      const duration = session.getDuration();
      expect(duration).toBe(1800000); // 30 minutes in milliseconds
    });
  });

  describe('getDurationInMinutes', () => {
    it('should return null when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.getDurationInMinutes()).toBeNull();
    });

    it('should return duration in minutes when stopped', () => {
      const stoppedAt = new Date('2024-01-01T10:30:00Z'); // 30 minutes later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      const duration = session.getDurationInMinutes();
      expect(duration).toBe(30);
    });
  });

  describe('getDurationInHours', () => {
    it('should return null when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.getDurationInHours()).toBeNull();
    });

    it('should return duration in hours when stopped', () => {
      const stoppedAt = new Date('2024-01-01T12:00:00Z'); // 2 hours later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      const duration = session.getDurationInHours();
      expect(duration).toBe(2);
    });
  });

  describe('wasStoppedByCommand', () => {
    it('should return true when stopReason is COMMAND', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'COMMAND',
      });

      expect(session.wasStoppedByCommand()).toBe(true);
    });

    it('should return false when stopReason is not COMMAND', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'DISCONNECT',
      });

      expect(session.wasStoppedByCommand()).toBe(false);
    });
  });

  describe('wasStoppedByDisconnection', () => {
    it('should return true when stopReason is DISCONNECT', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'DISCONNECT',
      });

      expect(session.wasStoppedByDisconnection()).toBe(true);
    });

    it('should return false when stopReason is not DISCONNECT', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'COMMAND',
      });

      expect(session.wasStoppedByDisconnection()).toBe(false);
    });
  });

  describe('isLongSession', () => {
    it('should return false when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.isLongSession(8)).toBe(false);
    });

    it('should return true when session is longer than maxHours', () => {
      const stoppedAt = new Date('2024-01-01T19:00:00Z'); // 9 hours later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      expect(session.isLongSession(8)).toBe(true);
    });

    it('should return false when session is shorter than maxHours', () => {
      const stoppedAt = new Date('2024-01-01T17:00:00Z'); // 7 hours later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      expect(session.isLongSession(8)).toBe(false);
    });
  });

  describe('isShortSession', () => {
    it('should return false when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.isShortSession(5)).toBe(false);
    });

    it('should return true when session is shorter than minMinutes', () => {
      const stoppedAt = new Date('2024-01-01T10:03:00Z'); // 3 minutes later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      expect(session.isShortSession(5)).toBe(true);
    });

    it('should return false when session is longer than minMinutes', () => {
      const stoppedAt = new Date('2024-01-01T10:10:00Z'); // 10 minutes later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      expect(session.isShortSession(5)).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return ACTIVE when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.getStatus()).toBe('ACTIVE');
    });

    it('should return STOPPED_BY_COMMAND when stopped by command', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'COMMAND',
      });

      expect(session.getStatus()).toBe('STOPPED_BY_COMMAND');
    });

    it('should return STOPPED_BY_DISCONNECTION when stopped by disconnection', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'DISCONNECT',
      });

      expect(session.getStatus()).toBe('STOPPED_BY_DISCONNECTION');
    });

    it('should return STOPPED for other stop reasons', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'OTHER',
      });

      expect(session.getStatus()).toBe('STOPPED');
    });
  });

  describe('getDurationString', () => {
    it('should return "Active" when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.getDurationString()).toBe('Active');
    });

    it('should return hours and minutes format when duration is hours', () => {
      const stoppedAt = new Date('2024-01-01T12:30:00Z'); // 2 hours 30 minutes later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      const durationString = session.getDurationString();
      expect(durationString).toContain('2h');
      expect(durationString).toContain('30m');
    });

    it('should return minutes format when duration is only minutes', () => {
      const stoppedAt = new Date('2024-01-01T10:30:00Z'); // 30 minutes later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      const durationString = session.getDurationString();
      expect(durationString).toBe('30m');
    });

    it('should return "Less than 1 minute" when duration is very short', () => {
      const stoppedAt = new Date('2024-01-01T10:00:30Z'); // 30 seconds later
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      expect(session.getDurationString()).toBe('Less than 1 minute');
    });
  });

  describe('startedRecently', () => {
    it('should return true when started recently', () => {
      const startedAt = new Date(Date.now() - 180000); // 3 minutes ago
      const session = new StreamingSessionHistory({
        ...baseProps,
        startedAt,
      });

      expect(session.startedRecently(5)).toBe(true);
    });

    it('should return false when started long ago', () => {
      const startedAt = new Date(Date.now() - 420000); // 7 minutes ago
      const session = new StreamingSessionHistory({
        ...baseProps,
        startedAt,
      });

      expect(session.startedRecently(5)).toBe(false);
    });
  });

  describe('stoppedRecently', () => {
    it('should return false when session is active', () => {
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt: null,
      });

      expect(session.stoppedRecently(5)).toBe(false);
    });

    it('should return true when stopped recently', () => {
      const stoppedAt = new Date(Date.now() - 180000); // 3 minutes ago
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      expect(session.stoppedRecently(5)).toBe(true);
    });

    it('should return false when stopped long ago', () => {
      const stoppedAt = new Date(Date.now() - 420000); // 7 minutes ago
      const session = new StreamingSessionHistory({
        ...baseProps,
        stoppedAt,
      });

      expect(session.stoppedRecently(5)).toBe(false);
    });
  });
});

