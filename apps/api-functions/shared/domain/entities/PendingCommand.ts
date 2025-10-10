/**
 * @fileoverview PendingCommand - Domain entity for pending commands
 * @description Encapsulates command business logic and state management
 */

import { CommandType } from '@prisma/client';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Domain entity representing a PendingCommand with business logic
 */
export class PendingCommand {
  public readonly id: string;
  public readonly employeeId: string;
  public readonly command: CommandType;
  public readonly timestamp: Date;
  public readonly published: boolean;
  public readonly publishedAt: Date | null;
  public readonly acknowledged: boolean;
  public readonly acknowledgedAt: Date | null;
  public readonly attemptCount: number;
  public readonly expiresAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  /**
   * Creates a new PendingCommand entity
   * @param props - PendingCommand properties
   */
  constructor(props: {
    id: string;
    employeeId: string;
    command: CommandType;
    timestamp: Date;
    published?: boolean;
    publishedAt?: Date | null;
    acknowledged?: boolean;
    acknowledgedAt?: Date | null;
    attemptCount?: number;
    expiresAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.employeeId = props.employeeId;
    this.command = props.command;
    this.timestamp = props.timestamp;
    this.published = props.published || false;
    this.publishedAt = props.publishedAt || null;
    this.acknowledged = props.acknowledged || false;
    this.acknowledgedAt = props.acknowledgedAt || null;
    this.attemptCount = props.attemptCount || 0;
    this.expiresAt = props.expiresAt || null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a PendingCommand entity from Prisma model
   * @param prismaCommand - Prisma PendingCommand model
   * @returns PendingCommand entity
   */
  static fromPrisma(prismaCommand: any): PendingCommand {
    return new PendingCommand({
      id: prismaCommand.id,
      employeeId: prismaCommand.employeeId,
      command: prismaCommand.command,
      timestamp: prismaCommand.timestamp,
      published: prismaCommand.published,
      publishedAt: prismaCommand.publishedAt,
      acknowledged: prismaCommand.acknowledged,
      acknowledgedAt: prismaCommand.acknowledgedAt,
      attemptCount: prismaCommand.attemptCount,
      expiresAt: prismaCommand.expiresAt,
      createdAt: prismaCommand.createdAt,
      updatedAt: prismaCommand.updatedAt,
    });
  }

  /**
   * Checks if the command is expired
   * @returns True if command is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return getCentralAmericaTime() > this.expiresAt;
  }

  /**
   * Checks if the command is pending (not published and not acknowledged)
   * @returns True if command is pending
   */
  isPending(): boolean {
    return !this.published && !this.acknowledged && !this.isExpired();
  }

  /**
   * Checks if the command is published but not acknowledged
   * @returns True if command is published but not acknowledged
   */
  isPublishedButNotAcknowledged(): boolean {
    return this.published && !this.acknowledged && !this.isExpired();
  }

  /**
   * Checks if the command is completed (acknowledged)
   * @returns True if command is completed
   */
  isCompleted(): boolean {
    return this.acknowledged;
  }

  /**
   * Checks if the command is a START command
   * @returns True if command is START
   */
  isStartCommand(): boolean {
    return this.command === CommandType.START;
  }

  /**
   * Checks if the command is a STOP command
   * @returns True if command is STOP
   */
  isStopCommand(): boolean {
    return this.command === CommandType.STOP;
  }

  /**
   * Gets the command type as string
   * @returns Command type as string
   */
  getCommandTypeString(): string {
    return this.command;
  }

  /**
   * Checks if the command has been attempted too many times
   * @param maxAttempts - Maximum number of attempts allowed
   * @returns True if command has exceeded max attempts
   */
  hasExceededMaxAttempts(maxAttempts: number = 3): boolean {
    return this.attemptCount >= maxAttempts;
  }

  /**
   * Gets the age of the command in milliseconds
   * @returns Age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.timestamp.getTime();
  }

  /**
   * Gets the age of the command in minutes
   * @returns Age in minutes
   */
  getAgeInMinutes(): number {
    return Math.floor(this.getAge() / (1000 * 60));
  }

  /**
   * Checks if the command is old (older than specified minutes)
   * @param maxAgeMinutes - Maximum age in minutes
   * @returns True if command is old
   */
  isOld(maxAgeMinutes: number = 30): boolean {
    return this.getAgeInMinutes() > maxAgeMinutes;
  }
}
