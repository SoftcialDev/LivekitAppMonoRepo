/**
 * @fileoverview SupervisorAssignment - Domain value object for supervisor assignments
 * @description Represents a supervisor assignment operation
 */

import { SupervisorChangeType } from '../enums/SupervisorChangeType';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Interface for the raw supervisor assignment request payload.
 */
export interface SupervisorAssignmentRequestPayload {
  userEmails: string[];
  newSupervisorEmail: string | null;
}

/**
 * Value object representing a supervisor assignment operation.
 */
export class SupervisorAssignment {
  /**
   * The emails of users to assign supervisor to.
   * @type {string[]}
   */
  public readonly userEmails: string[];

  /**
   * The email of the new supervisor (null for unassign).
   * @type {string | null}
   */
  public readonly newSupervisorEmail: string | null;

  /**
   * The type of supervisor change operation.
   * @type {SupervisorChangeType}
   */
  public readonly changeType: SupervisorChangeType;

  /**
   * The timestamp when the assignment was created.
   * @type {Date}
   */
  public readonly timestamp: Date;

  /**
   * Creates an instance of SupervisorAssignment.
   * @param userEmails - The emails of users to assign supervisor to.
   * @param newSupervisorEmail - The email of the new supervisor.
   * @param timestamp - The timestamp of the assignment.
   */
  constructor(
    userEmails: string[],
    newSupervisorEmail: string | null,
    timestamp: Date
  ) {
    this.userEmails = userEmails.map(email => email.toLowerCase());
    this.newSupervisorEmail = newSupervisorEmail?.toLowerCase() || null;
    this.changeType = newSupervisorEmail ? SupervisorChangeType.ASSIGN : SupervisorChangeType.UNASSIGN;
    this.timestamp = timestamp;
  }

  /**
   * Creates a SupervisorAssignment instance from a raw request payload.
   * @param payload - The raw supervisor assignment request payload.
   * @returns A new SupervisorAssignment instance.
   */
  static fromRequest(payload: SupervisorAssignmentRequestPayload): SupervisorAssignment {
    return new SupervisorAssignment(
      payload.userEmails,
      payload.newSupervisorEmail,
      getCentralAmericaTime()
    );
  }

  /**
   * Converts the SupervisorAssignment instance to a payload suitable for messaging.
   * @returns An object representing the assignment payload.
   */
  toPayload(): { userEmails: string[]; newSupervisorEmail: string | null; changeType: SupervisorChangeType; timestamp: string } {
    return {
      userEmails: this.userEmails,
      newSupervisorEmail: this.newSupervisorEmail,
      changeType: this.changeType,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
