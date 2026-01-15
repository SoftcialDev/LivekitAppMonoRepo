import { PendingCommand } from '../../../src/domain/entities/PendingCommand';
import { CommandType } from '@prisma/client';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';

// Mock dateUtils
jest.mock('../../../src/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2024-01-01T12:00:00Z')),
}));

const mockedGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;

describe('PendingCommand', () => {
  const baseProps = {
    id: 'command-id',
    employeeId: 'employee-id',
    command: CommandType.START,
    timestamp: new Date('2024-01-01T10:00:00Z'),
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCentralAmericaTime.mockReturnValue(new Date('2024-01-01T12:00:00Z'));
  });

  describe('constructor', () => {
    it('should create PendingCommand with required properties', () => {
      const command = new PendingCommand(baseProps);

      expect(command.id).toBe(baseProps.id);
      expect(command.employeeId).toBe(baseProps.employeeId);
      expect(command.command).toBe(baseProps.command);
      expect(command.timestamp).toBe(baseProps.timestamp);
    });

    it('should set default values for optional properties', () => {
      const command = new PendingCommand(baseProps);

      expect(command.published).toBe(false);
      expect(command.publishedAt).toBeNull();
      expect(command.acknowledged).toBe(false);
      expect(command.acknowledgedAt).toBeNull();
      expect(command.attemptCount).toBe(0);
      expect(command.expiresAt).toBeNull();
    });

    it('should set provided optional properties', () => {
      const publishedAt = new Date('2024-01-01T11:00:00Z');
      const acknowledgedAt = new Date('2024-01-01T11:30:00Z');
      const expiresAt = new Date('2024-01-01T13:00:00Z');

      const command = new PendingCommand({
        ...baseProps,
        published: true,
        publishedAt,
        acknowledged: true,
        acknowledgedAt,
        attemptCount: 2,
        expiresAt,
      });

      expect(command.published).toBe(true);
      expect(command.publishedAt).toBe(publishedAt);
      expect(command.acknowledged).toBe(true);
      expect(command.acknowledgedAt).toBe(acknowledgedAt);
      expect(command.attemptCount).toBe(2);
      expect(command.expiresAt).toBe(expiresAt);
    });
  });

  describe('fromPrisma', () => {
    it('should create PendingCommand from Prisma model', () => {
      const prismaCommand = {
        id: 'prisma-id',
        employeeId: 'prisma-employee-id',
        command: CommandType.STOP,
        timestamp: new Date('2024-01-01T09:00:00Z'),
        published: true,
        publishedAt: new Date('2024-01-01T09:30:00Z'),
        acknowledged: false,
        acknowledgedAt: null,
        attemptCount: 1,
        expiresAt: new Date('2024-01-01T14:00:00Z'),
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T09:30:00Z'),
      };

      const command = PendingCommand.fromPrisma(prismaCommand);

      expect(command.id).toBe(prismaCommand.id);
      expect(command.employeeId).toBe(prismaCommand.employeeId);
      expect(command.command).toBe(prismaCommand.command);
      expect(command.published).toBe(prismaCommand.published);
      expect(command.attemptCount).toBe(prismaCommand.attemptCount);
    });
  });

  describe('isExpired', () => {
    it('should return false when expiresAt is null', () => {
      const command = new PendingCommand(baseProps);
      expect(command.isExpired()).toBe(false);
    });

    it('should return false when command has not expired', () => {
      const futureDate = new Date('2024-01-01T13:00:00Z');
      mockedGetCentralAmericaTime.mockReturnValue(new Date('2024-01-01T12:00:00Z'));

      const command = new PendingCommand({
        ...baseProps,
        expiresAt: futureDate,
      });

      expect(command.isExpired()).toBe(false);
    });

    it('should return true when command has expired', () => {
      const pastDate = new Date('2024-01-01T11:00:00Z');
      mockedGetCentralAmericaTime.mockReturnValue(new Date('2024-01-01T12:00:00Z'));

      const command = new PendingCommand({
        ...baseProps,
        expiresAt: pastDate,
      });

      expect(command.isExpired()).toBe(true);
    });
  });

  describe('isPending', () => {
    it('should return true when not published, not acknowledged, and not expired', () => {
      const command = new PendingCommand(baseProps);
      expect(command.isPending()).toBe(true);
    });

    it('should return false when published', () => {
      const command = new PendingCommand({
        ...baseProps,
        published: true,
      });
      expect(command.isPending()).toBe(false);
    });

    it('should return false when acknowledged', () => {
      const command = new PendingCommand({
        ...baseProps,
        acknowledged: true,
      });
      expect(command.isPending()).toBe(false);
    });

    it('should return false when expired', () => {
      const pastDate = new Date('2024-01-01T11:00:00Z');
      mockedGetCentralAmericaTime.mockReturnValue(new Date('2024-01-01T12:00:00Z'));

      const command = new PendingCommand({
        ...baseProps,
        expiresAt: pastDate,
      });
      expect(command.isPending()).toBe(false);
    });
  });

  describe('isPublishedButNotAcknowledged', () => {
    it('should return true when published but not acknowledged and not expired', () => {
      const command = new PendingCommand({
        ...baseProps,
        published: true,
        acknowledged: false,
      });
      expect(command.isPublishedButNotAcknowledged()).toBe(true);
    });

    it('should return false when not published', () => {
      const command = new PendingCommand({
        ...baseProps,
        published: false,
      });
      expect(command.isPublishedButNotAcknowledged()).toBe(false);
    });

    it('should return false when acknowledged', () => {
      const command = new PendingCommand({
        ...baseProps,
        published: true,
        acknowledged: true,
      });
      expect(command.isPublishedButNotAcknowledged()).toBe(false);
    });

    it('should return false when expired', () => {
      const pastDate = new Date('2024-01-01T11:00:00Z');
      mockedGetCentralAmericaTime.mockReturnValue(new Date('2024-01-01T12:00:00Z'));

      const command = new PendingCommand({
        ...baseProps,
        published: true,
        acknowledged: false,
        expiresAt: pastDate,
      });
      expect(command.isPublishedButNotAcknowledged()).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true when acknowledged', () => {
      const command = new PendingCommand({
        ...baseProps,
        acknowledged: true,
      });
      expect(command.isCompleted()).toBe(true);
    });

    it('should return false when not acknowledged', () => {
      const command = new PendingCommand(baseProps);
      expect(command.isCompleted()).toBe(false);
    });
  });

  describe('isStartCommand', () => {
    it('should return true when command is START', () => {
      const command = new PendingCommand({
        ...baseProps,
        command: CommandType.START,
      });
      expect(command.isStartCommand()).toBe(true);
    });

    it('should return false when command is not START', () => {
      const command = new PendingCommand({
        ...baseProps,
        command: CommandType.STOP,
      });
      expect(command.isStartCommand()).toBe(false);
    });
  });

  describe('isStopCommand', () => {
    it('should return true when command is STOP', () => {
      const command = new PendingCommand({
        ...baseProps,
        command: CommandType.STOP,
      });
      expect(command.isStopCommand()).toBe(true);
    });

    it('should return false when command is not STOP', () => {
      const command = new PendingCommand({
        ...baseProps,
        command: CommandType.START,
      });
      expect(command.isStopCommand()).toBe(false);
    });
  });

  describe('getCommandTypeString', () => {
    it('should return command type as string', () => {
      const command = new PendingCommand({
        ...baseProps,
        command: CommandType.START,
      });
      expect(command.getCommandTypeString()).toBe(CommandType.START);
    });
  });

  describe('hasExceededMaxAttempts', () => {
    it('should return false when attemptCount is less than maxAttempts', () => {
      const command = new PendingCommand({
        ...baseProps,
        attemptCount: 2,
      });
      expect(command.hasExceededMaxAttempts(3)).toBe(false);
    });

    it('should return true when attemptCount equals maxAttempts', () => {
      const command = new PendingCommand({
        ...baseProps,
        attemptCount: 3,
      });
      expect(command.hasExceededMaxAttempts(3)).toBe(true);
    });

    it('should return true when attemptCount exceeds maxAttempts', () => {
      const command = new PendingCommand({
        ...baseProps,
        attemptCount: 4,
      });
      expect(command.hasExceededMaxAttempts(3)).toBe(true);
    });

    it('should use default maxAttempts of 3', () => {
      const command = new PendingCommand({
        ...baseProps,
        attemptCount: 3,
      });
      expect(command.hasExceededMaxAttempts()).toBe(true);
    });
  });

  describe('getAge', () => {
    it('should return age in milliseconds', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:05:00Z').getTime());

      const command = new PendingCommand({
        ...baseProps,
        timestamp,
      });

      const age = command.getAge();
      expect(age).toBe(5 * 60 * 1000); // 5 minutes in milliseconds
    });
  });

  describe('getAgeInMinutes', () => {
    it('should return age in minutes', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:05:30Z').getTime());

      const command = new PendingCommand({
        ...baseProps,
        timestamp,
      });

      const ageInMinutes = command.getAgeInMinutes();
      expect(ageInMinutes).toBe(5); // Should floor to 5 minutes
    });
  });

  describe('isOld', () => {
    it('should return false when command is not old', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:15:00Z').getTime());

      const command = new PendingCommand({
        ...baseProps,
        timestamp,
      });

      expect(command.isOld(30)).toBe(false);
    });

    it('should return true when command is old', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:35:00Z').getTime());

      const command = new PendingCommand({
        ...baseProps,
        timestamp,
      });

      expect(command.isOld(30)).toBe(true);
    });

    it('should use default maxAgeMinutes of 30', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:35:00Z').getTime());

      const command = new PendingCommand({
        ...baseProps,
        timestamp,
      });

      expect(command.isOld()).toBe(true);
    });
  });
});

