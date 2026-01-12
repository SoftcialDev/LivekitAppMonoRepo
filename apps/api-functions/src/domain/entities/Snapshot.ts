/**
 * @fileoverview Snapshot.ts - Domain entity for snapshot reports
 * @summary Encapsulates snapshot report business logic and state management
 * @description Represents a snapshot report with all associated metadata and business rules
 */

import { SnapshotReason } from '../enums/SnapshotReason';

/**
 * Domain entity representing a Snapshot with business logic.
 * @description Encapsulates snapshot report data and provides domain methods
 * for validation and business rule enforcement.
 */
export class Snapshot {
  public readonly id: string;
  public readonly supervisorId: string;
  public readonly psoId: string;
  public readonly reason: string;
  public readonly description: string | null;
  public readonly takenAt: Date;
  public readonly imageUrl: string;
  public readonly supervisor?: {
    fullName: string;
  };
  public readonly pso?: {
    fullName: string;
    email: string;
  };

  /**
   * Creates a new Snapshot entity.
   * @param props - Snapshot properties
   */
  constructor(props: {
    id: string;
    supervisorId: string;
    psoId: string;
    reason: string;
    description?: string | null;
    takenAt: Date;
    imageUrl: string;
    supervisor?: {
      fullName: string;
    };
    pso?: {
      fullName: string;
      email: string;
    };
  }) {
    this.id = props.id;
    this.supervisorId = props.supervisorId;
    this.psoId = props.psoId;
    this.reason = props.reason;
    this.description = props.description || null;
    this.takenAt = props.takenAt;
    this.imageUrl = props.imageUrl;
    this.supervisor = props.supervisor;
    this.pso = props.pso;
  }

  /**
   * Creates a Snapshot entity from Prisma model.
   * @param prismaSnapshot - Prisma Snapshot model with optional relations
   * @returns Snapshot entity
   */
  static fromPrisma(prismaSnapshot: {
    id: string;
    supervisorId: string;
    psoId: string;
    reason: { id: string; label: string; code: string } | null;
    description: string | null;
    takenAt: Date;
    imageUrl: string;
    supervisor?: { fullName: string | null } | null;
    pso?: { fullName: string | null; email: string } | null;
  }): Snapshot {
    return new Snapshot({
      id: prismaSnapshot.id,
      supervisorId: prismaSnapshot.supervisorId,
      psoId: prismaSnapshot.psoId,
      reason: prismaSnapshot.reason?.label ?? '',
      description: prismaSnapshot.description,
      takenAt: prismaSnapshot.takenAt,
      imageUrl: prismaSnapshot.imageUrl,
      supervisor: prismaSnapshot.supervisor?.fullName ? {
        fullName: prismaSnapshot.supervisor.fullName
      } : undefined,
      pso: prismaSnapshot.pso?.fullName ? {
        fullName: prismaSnapshot.pso.fullName,
        email: prismaSnapshot.pso.email
      } : undefined,
    });
  }

  /**
   * Checks if the snapshot reason requires a description.
   * @returns True if reason is "OTHER" and description is required
   */
  requiresDescription(): boolean {
    return this.reason === SnapshotReason.OTHER;
  }

  /**
   * Validates that the snapshot has a description when required.
   * @returns True if description is present when required, or not required
   */
  hasValidDescription(): boolean {
    if (this.requiresDescription()) {
      return this.description !== null && this.description.trim().length > 0;
    }
    return true;
  }

  /**
   * Gets the age of the snapshot in milliseconds.
   * @returns Age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.takenAt.getTime();
  }

  /**
   * Gets the age of the snapshot in minutes.
   * @returns Age in minutes
   */
  getAgeInMinutes(): number {
    return Math.floor(this.getAge() / (1000 * 60));
  }

  /**
   * Gets the age of the snapshot in hours.
   * @returns Age in hours
   */
  getAgeInHours(): number {
    return Math.floor(this.getAge() / (1000 * 60 * 60));
  }

  /**
   * Gets the age of the snapshot in days.
   * @returns Age in days
   */
  getAgeInDays(): number {
    return Math.floor(this.getAge() / (1000 * 60 * 60 * 24));
  }

  /**
   * Checks if the snapshot is recent (within specified minutes).
   * @param maxMinutes - Maximum minutes to consider recent
   * @returns True if snapshot is recent
   */
  isRecent(maxMinutes: number = 60): boolean {
    return this.getAgeInMinutes() <= maxMinutes;
  }

  /**
   * Checks if the snapshot reason is "OTHER".
   * @returns True if reason is "OTHER"
   */
  isOtherReason(): boolean {
    return this.reason === SnapshotReason.OTHER;
  }

  /**
   * Gets the human-readable reason label.
   * @returns Human-readable reason label
   */
  getReasonLabel(): string {
    const labels: Record<string, string> = {
      [SnapshotReason.ATTENTIVENESS_ALERTNESS]: 'Attentiveness / Alertness',
      [SnapshotReason.TIME_ATTENDANCE]: 'Time & Attendance (unjustified absence, no show, late)',
      [SnapshotReason.PERFORMANCE]: 'Performance',
      [SnapshotReason.COMPLIANCE]: 'Compliance (Background / HIPAA / Uniform / Other)',
      [SnapshotReason.PROFESSIONAL_APPEARANCE]: 'Professional appearance and demeanor',
      [SnapshotReason.OTHER]: 'Other'
    };
    return labels[this.reason] || this.reason;
  }
}

