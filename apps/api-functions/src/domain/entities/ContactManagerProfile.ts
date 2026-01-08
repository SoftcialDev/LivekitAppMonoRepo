/**
 * @fileoverview ContactManagerProfile - Domain entity for contact manager profiles
 * @description Encapsulates contact manager business logic and state management
 */

import { ContactManagerStatus } from '@prisma/client';

/**
 * Domain entity representing a ContactManagerProfile with business logic
 */
export class ContactManagerProfile {
  public readonly id: string;
  public readonly userId: string;
  public readonly status: ContactManagerStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly user?: {
    email: string;
    fullName: string;
  };

  /**
   * Creates a new ContactManagerProfile entity
   * @param props - ContactManagerProfile properties
   */
  constructor(props: {
    id: string;
    userId: string;
    status: ContactManagerStatus;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      email: string;
      fullName: string;
    };
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.user = props.user;
  }

  /**
   * Creates a ContactManagerProfile entity from Prisma model
   * @param prismaProfile - Prisma ContactManagerProfile model
   * @returns ContactManagerProfile entity
   */
  static fromPrisma(prismaProfile: {
    id: string;
    userId: string;
    status: ContactManagerStatus;
    createdAt: Date;
    updatedAt: Date;
    user?: { email: string; fullName: string | null } | null;
  }): ContactManagerProfile {
    return new ContactManagerProfile({
      id: prismaProfile.id,
      userId: prismaProfile.userId,
      status: prismaProfile.status,
      createdAt: prismaProfile.createdAt,
      updatedAt: prismaProfile.updatedAt,
      user: prismaProfile.user && prismaProfile.user.fullName ? {
        email: prismaProfile.user.email,
        fullName: prismaProfile.user.fullName
      } : undefined
    });
  }

  /**
   * Checks if the contact manager is available
   * @returns True if contact manager is available
   */
  isAvailable(): boolean {
    return this.status === ContactManagerStatus.Available;
  }

  /**
   * Checks if the contact manager is unavailable
   * @returns True if contact manager is unavailable
   */
  isUnavailable(): boolean {
    return this.status === ContactManagerStatus.Unavailable;
  }

  /**
   * Checks if the contact manager is on break
   * @returns True if contact manager is on break
   */
  isOnBreak(): boolean {
    return this.status === ContactManagerStatus.OnBreak;
  }

  /**
   * Checks if the contact manager is on another task
   * @returns True if contact manager is on another task
   */
  isOnAnotherTask(): boolean {
    return this.status === ContactManagerStatus.OnAnotherTask;
  }

  /**
   * Checks if the contact manager is busy (on break or another task)
   * @returns True if contact manager is busy
   */
  isBusy(): boolean {
    return this.isOnBreak() || this.isOnAnotherTask();
  }

  /**
   * Checks if the contact manager can take new requests
   * @returns True if contact manager can take new requests
   */
  canTakeRequests(): boolean {
    return this.isAvailable();
  }

  /**
   * Gets the status as a human-readable string
   * @returns Status string
   */
  getStatusString(): string {
    switch (this.status) {
      case ContactManagerStatus.Available:
        return 'Available';
      case ContactManagerStatus.Unavailable:
        return 'Unavailable';
      case ContactManagerStatus.OnBreak:
        return 'On Break';
      case ContactManagerStatus.OnAnotherTask:
        return 'On Another Task';
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets the status color for UI display
   * @returns Status color
   */
  getStatusColor(): string {
    switch (this.status) {
      case ContactManagerStatus.Available:
        return 'green';
      case ContactManagerStatus.Unavailable:
        return 'red';
      case ContactManagerStatus.OnBreak:
        return 'yellow';
      case ContactManagerStatus.OnAnotherTask:
        return 'orange';
      default:
        return 'gray';
    }
  }

  /**
   * Checks if the profile was created recently (within specified hours)
   * @param maxHours - Maximum hours to consider recent
   * @returns True if profile was created recently
   */
  wasCreatedRecently(maxHours: number = 24): boolean {
    const ageHours = Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
    return ageHours <= maxHours;
  }

  /**
   * Checks if the profile was updated recently (within specified minutes)
   * @param maxMinutes - Maximum minutes to consider recent
   * @returns True if profile was updated recently
   */
  wasUpdatedRecently(maxMinutes: number = 10): boolean {
    const ageMinutes = Math.floor((Date.now() - this.updatedAt.getTime()) / (1000 * 60));
    return ageMinutes <= maxMinutes;
  }

  /**
   * Checks if the contact manager is in a working state (available or on another task)
   * @returns True if contact manager is in a working state
   */
  isInWorkingState(): boolean {
    return this.isAvailable() || this.isOnAnotherTask();
  }

  /**
   * Checks if the contact manager is in a non-working state (unavailable or on break)
   * @returns True if contact manager is in a non-working state
   */
  isInNonWorkingState(): boolean {
    return this.isUnavailable() || this.isOnBreak();
  }

  /**
   * Gets the priority level for assignment (lower number = higher priority)
   * @returns Priority level
   */
  getAssignmentPriority(): number {
    switch (this.status) {
      case ContactManagerStatus.Available:
        return 1; // Highest priority
      case ContactManagerStatus.OnAnotherTask:
        return 2; // Medium priority
      case ContactManagerStatus.OnBreak:
        return 3; // Lower priority
      case ContactManagerStatus.Unavailable:
        return 4; // Lowest priority
      default:
        return 5; // Unknown priority
    }
  }

  /**
   * Converts the entity to a payload format for API responses
   * @returns Payload representation of the contact manager profile
   */
  toPayload(): { id: string; userId: string; status: ContactManagerStatus; createdAt: string; updatedAt: string } {
    return {
      id: this.id,
      userId: this.userId,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
