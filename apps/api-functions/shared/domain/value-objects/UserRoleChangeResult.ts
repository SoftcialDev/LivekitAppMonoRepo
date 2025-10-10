/**
 * @fileoverview UserRoleChangeResult - Domain value object for user role change results
 * @description Represents the outcome of a user role change operation
 */

import { UserRole } from '@prisma/client';

/**
 * Value object representing the result of a user role change operation.
 */
export class UserRoleChangeResult {
  /**
   * The email of the user whose role was changed.
   * @type {string}
   */
  public readonly userEmail: string;

  /**
   * The previous role of the user.
   * @type {UserRole | null}
   */
  public readonly previousRole: UserRole | null;

  /**
   * The new role assigned to the user.
   * @type {UserRole | null}
   */
  public readonly newRole: UserRole | null;

  /**
   * Whether the user was created during this operation.
   * @type {boolean}
   */
  public readonly userCreated: boolean;

  /**
   * Whether the user was deleted during this operation.
   * @type {boolean}
   */
  public readonly userDeleted: boolean;

  /**
   * The Azure AD object ID of the user.
   * @type {string}
   */
  public readonly azureAdObjectId: string;

  /**
   * The display name of the user.
   * @type {string}
   */
  public readonly displayName: string;

  /**
   * Creates an instance of UserRoleChangeResult.
   * @param userEmail - The email of the user.
   * @param previousRole - The previous role.
   * @param newRole - The new role.
   * @param userCreated - Whether the user was created.
   * @param userDeleted - Whether the user was deleted.
   * @param azureAdObjectId - The Azure AD object ID.
   * @param displayName - The display name.
   */
  constructor(
    userEmail: string,
    previousRole: UserRole | null,
    newRole: UserRole | null,
    userCreated: boolean,
    userDeleted: boolean,
    azureAdObjectId: string,
    displayName: string
  ) {
    this.userEmail = userEmail;
    this.previousRole = previousRole;
    this.newRole = newRole;
    this.userCreated = userCreated;
    this.userDeleted = userDeleted;
    this.azureAdObjectId = azureAdObjectId;
    this.displayName = displayName;
  }

  /**
   * Creates a successful role change result.
   * @param userEmail - The email of the user.
   * @param previousRole - The previous role.
   * @param newRole - The new role.
   * @param azureAdObjectId - The Azure AD object ID.
   * @param displayName - The display name.
   * @param userCreated - Whether the user was created.
   * @returns A new UserRoleChangeResult instance.
   */
  static roleChanged(
    userEmail: string,
    previousRole: UserRole | null,
    newRole: UserRole,
    azureAdObjectId: string,
    displayName: string,
    userCreated: boolean = false
  ): UserRoleChangeResult {
    return new UserRoleChangeResult(
      userEmail,
      previousRole,
      newRole,
      userCreated,
      false,
      azureAdObjectId,
      displayName
    );
  }

  /**
   * Creates a user deletion result.
   * @param userEmail - The email of the user.
   * @param previousRole - The previous role.
   * @param azureAdObjectId - The Azure AD object ID.
   * @param displayName - The display name.
   * @returns A new UserRoleChangeResult instance.
   */
  static userDeleted(
    userEmail: string,
    previousRole: UserRole | null,
    azureAdObjectId: string,
    displayName: string
  ): UserRoleChangeResult {
    return new UserRoleChangeResult(
      userEmail,
      previousRole,
      null,
      false,
      true,
      azureAdObjectId,
      displayName
    );
  }

  /**
   * Gets a human-readable summary of the change.
   * @returns Summary string.
   */
  getSummary(): string {
    if (this.userDeleted) {
      return `${this.userEmail} deleted`;
    }
    
    if (this.userCreated) {
      return `${this.userEmail} created with role ${this.newRole}`;
    }
    
    return `${this.userEmail} role changed from ${this.previousRole || 'none'} to ${this.newRole}`;
  }

  /**
   * Checks if the role actually changed.
   * @returns True if the role changed.
   */
  roleChanged(): boolean {
    return this.previousRole !== this.newRole;
  }

  /**
   * Gets the operation type.
   * @returns Operation type string.
   */
  getOperationType(): string {
    if (this.userDeleted) return 'DELETE';
    if (this.userCreated) return 'CREATE';
    if (this.roleChanged()) return 'UPDATE';
    return 'NO_CHANGE';
  }
}
