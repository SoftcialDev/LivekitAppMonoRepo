/**
 * @fileoverview PendingCommand entity - unit tests
 */

// Mock CommandType enum globally
jest.mock('@prisma/client', () => ({
  CommandType: {
    START: 'START',
    STOP: 'STOP'
  }
}));

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z'))
}));

import { PendingCommand } from '../../../../../shared/domain/entities/PendingCommand';
import { CommandType } from '@prisma/client';

describe('PendingCommand', () => {
  const baseCommandProps = {
    id: 'command123',
    employeeId: 'employee123',
    command: CommandType.START,
    timestamp: new Date('2023-01-01T10:00:00Z'),
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z')
  };

  describe('constructor', () => {
    it('creates command with all required properties', () => {
      const command = new PendingCommand(baseCommandProps);
      
      expect(command.id).toBe('command123');
      expect(command.employeeId).toBe('employee123');
      expect(command.command).toBe(CommandType.START);
      expect(command.timestamp).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(command.createdAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(command.updatedAt).toEqual(new Date('2023-01-01T11:00:00Z'));
    });

    it('sets optional properties to default values when not provided', () => {
      const command = new PendingCommand(baseCommandProps);
      
      expect(command.published).toBe(false);
      expect(command.publishedAt).toBeNull();
      expect(command.acknowledged).toBe(false);
      expect(command.acknowledgedAt).toBeNull();
      expect(command.attemptCount).toBe(0);
      expect(command.expiresAt).toBeNull();
    });

    it('sets optional properties when provided', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        published: true,
        publishedAt: new Date('2023-01-01T10:30:00Z'),
        acknowledged: true,
        acknowledgedAt: new Date('2023-01-01T11:00:00Z'),
        attemptCount: 2,
        expiresAt: new Date('2023-01-01T12:00:00Z')
      });
      
      expect(command.published).toBe(true);
      expect(command.publishedAt).toEqual(new Date('2023-01-01T10:30:00Z'));
      expect(command.acknowledged).toBe(true);
      expect(command.acknowledgedAt).toEqual(new Date('2023-01-01T11:00:00Z'));
      expect(command.attemptCount).toBe(2);
      expect(command.expiresAt).toEqual(new Date('2023-01-01T12:00:00Z'));
    });
  });

  describe('fromPrisma', () => {
    it('creates command from Prisma model', () => {
      const prismaCommand = {
        id: 'command123',
        employeeId: 'employee123',
        command: CommandType.START,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        published: true,
        publishedAt: new Date('2023-01-01T10:30:00Z'),
        acknowledged: false,
        acknowledgedAt: null,
        attemptCount: 1,
        expiresAt: new Date('2023-01-01T12:00:00Z'),
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };

      const command = PendingCommand.fromPrisma(prismaCommand);
      
      expect(command.id).toBe('command123');
      expect(command.employeeId).toBe('employee123');
      expect(command.command).toBe(CommandType.START);
      expect(command.published).toBe(true);
      expect(command.acknowledged).toBe(false);
    });
  });

  describe('status checks', () => {
    it('isExpired returns false when no expiration date', () => {
      const command = new PendingCommand(baseCommandProps);
      expect(command.isExpired()).toBe(false);
    });

    it('isExpired returns false when not yet expired', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        expiresAt: new Date('2023-01-01T13:00:00Z') // Future date
      });
      expect(command.isExpired()).toBe(false);
    });

    it('isExpired returns true when expired', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        expiresAt: new Date('2023-01-01T11:00:00Z') // Past date
      });
      expect(command.isExpired()).toBe(true);
    });

    it('isPending returns true for unpublished, unacknowledged, non-expired command', () => {
      const command = new PendingCommand(baseCommandProps);
      expect(command.isPending()).toBe(true);
    });

    it('isPending returns false for published command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        published: true
      });
      expect(command.isPending()).toBe(false);
    });

    it('isPending returns false for acknowledged command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        acknowledged: true
      });
      expect(command.isPending()).toBe(false);
    });

    it('isPending returns false for expired command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        expiresAt: new Date('2023-01-01T11:00:00Z')
      });
      expect(command.isPending()).toBe(false);
    });

    it('isPublishedButNotAcknowledged returns true for published, unacknowledged, non-expired command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        published: true,
        acknowledged: false
      });
      expect(command.isPublishedButNotAcknowledged()).toBe(true);
    });

    it('isPublishedButNotAcknowledged returns false for acknowledged command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        published: true,
        acknowledged: true
      });
      expect(command.isPublishedButNotAcknowledged()).toBe(false);
    });

    it('isCompleted returns true for acknowledged command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        acknowledged: true
      });
      expect(command.isCompleted()).toBe(true);
    });

    it('isCompleted returns false for unacknowledged command', () => {
      const command = new PendingCommand(baseCommandProps);
      expect(command.isCompleted()).toBe(false);
    });
  });

  describe('command type checks', () => {
    it('isStartCommand returns true for START command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        command: CommandType.START
      });
      expect(command.isStartCommand()).toBe(true);
    });

    it('isStartCommand returns false for STOP command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        command: CommandType.STOP
      });
      expect(command.isStartCommand()).toBe(false);
    });

    it('isStopCommand returns true for STOP command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        command: CommandType.STOP
      });
      expect(command.isStopCommand()).toBe(true);
    });

    it('isStopCommand returns false for START command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        command: CommandType.START
      });
      expect(command.isStopCommand()).toBe(false);
    });

    it('getCommandTypeString returns command as string', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        command: CommandType.START
      });
      expect(command.getCommandTypeString()).toBe(CommandType.START);
    });
  });

  describe('attempt tracking', () => {
    it('hasExceededMaxAttempts returns false when under limit', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        attemptCount: 2
      });
      expect(command.hasExceededMaxAttempts(3)).toBe(false);
    });

    it('hasExceededMaxAttempts returns true when at limit', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        attemptCount: 3
      });
      expect(command.hasExceededMaxAttempts(3)).toBe(true);
    });

    it('hasExceededMaxAttempts returns true when over limit', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        attemptCount: 5
      });
      expect(command.hasExceededMaxAttempts(3)).toBe(true);
    });

    it('hasExceededMaxAttempts uses default limit of 3', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        attemptCount: 3
      });
      expect(command.hasExceededMaxAttempts()).toBe(true);
    });
  });

  describe('age calculations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('getAge returns age in milliseconds', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        timestamp: new Date('2023-01-01T10:00:00Z') // 2 hours ago
      });
      
      const age = command.getAge();
      expect(age).toBe(2 * 60 * 60 * 1000); // 2 hours in milliseconds
    });

    it('getAgeInMinutes returns age in minutes', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        timestamp: new Date('2023-01-01T10:00:00Z') // 2 hours ago
      });
      
      const ageMinutes = command.getAgeInMinutes();
      expect(ageMinutes).toBe(120); // 2 hours in minutes
    });

    it('isOld returns true for old command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        timestamp: new Date('2023-01-01T10:00:00Z') // 2 hours ago
      });
      
      expect(command.isOld(30)).toBe(true); // 30 minutes max age
    });

    it('isOld returns false for recent command', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        timestamp: new Date('2023-01-01T11:45:00Z') // 15 minutes ago
      });
      
      expect(command.isOld(30)).toBe(false); // 30 minutes max age
    });

    it('isOld uses default max age of 30 minutes', () => {
      const command = new PendingCommand({
        ...baseCommandProps,
        timestamp: new Date('2023-01-01T10:00:00Z') // 2 hours ago
      });
      
      expect(command.isOld()).toBe(true);
    });
  });
});
