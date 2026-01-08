/**
 * @fileoverview GetUserDebugResponse - Value object for get user debug responses
 * @summary Encapsulates comprehensive user debug information response
 * @description Value object that represents the response containing complete user debug information
 * including roles, permissions, Contact Manager profile, and supervisor information
 */

import {
  UserDebugInfo,
  RoleAssignmentInfo,
  PermissionInfo,
  ContactManagerProfileInfo,
  SupervisorInfo
} from '../types/UserDebugTypes';

/**
 * Response containing comprehensive user debug information
 */
export class GetUserDebugResponse {
  /**
   * Creates a new GetUserDebugResponse instance
   * @param user - User basic information
   * @param roles - User role assignments
   * @param permissions - User effective permissions
   * @param contactManagerProfile - Contact Manager profile if applicable
   * @param supervisor - Supervisor information if applicable
   */
  constructor(
    public readonly user: UserDebugInfo,
    public readonly roles: RoleAssignmentInfo[],
    public readonly permissions: PermissionInfo[],
    public readonly contactManagerProfile: ContactManagerProfileInfo | null,
    public readonly supervisor: SupervisorInfo | null
  ) {}

  /**
   * Converts response to plain object for API response
   * @returns Plain object representation
   */
  toPayload() {
    return {
      user: this.user,
      roles: this.roles,
      permissions: this.permissions,
      contactManagerProfile: this.contactManagerProfile,
      supervisor: this.supervisor
    };
  }
}

