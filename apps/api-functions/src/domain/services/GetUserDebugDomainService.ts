/**
 * @fileoverview GetUserDebugDomainService - Domain service for user debug operations
 * @summary Handles business logic for retrieving comprehensive user debug information
 * @description Provides functionality to retrieve complete user information including
 * roles, permissions, Contact Manager profile, and supervisor information for debugging purposes
 */

import { IUserRepository } from '../interfaces/IUserRepository';
import { IUserRoleAssignmentRepository } from '../interfaces/IUserRoleAssignmentRepository';
import { IPermissionRepository } from '../interfaces/IPermissionRepository';
import { GetUserDebugRequest } from '../value-objects/GetUserDebugRequest';
import { GetUserDebugResponse } from '../value-objects/GetUserDebugResponse';
import {
  RoleAssignmentInfo,
  PermissionInfo,
  ContactManagerProfileInfo,
  SupervisorInfo,
  UserDebugInfo
} from '../types/UserDebugTypes';
import { UserNotFoundError } from '../errors/UserErrors';

/**
 * Domain service for user debug operations
 */
export class GetUserDebugDomainService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userRoleAssignmentRepository: IUserRoleAssignmentRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  /**
   * Gets comprehensive user debug information
   * @param request - Get user debug request
   * @returns Promise that resolves to GetUserDebugResponse
   * @throws UserNotFoundError if user is not found
   */
  async getUserDebug(request: GetUserDebugRequest): Promise<GetUserDebugResponse> {
    // Find user by email or Azure AD Object ID
    let user = await this.userRepository.findByEmail(request.userIdentifier);
    if (!user) {
      user = await this.userRepository.findByAzureAdObjectId(request.userIdentifier);
    }

    if (!user) {
      throw new UserNotFoundError(`User not found: ${request.userIdentifier}`);
    }

    // Get role assignments
    const roles = await this.getRoleAssignments(user.id);

    // Get effective permissions
    const permissions = await this.getPermissions(user.azureAdObjectId);

    // Get Contact Manager profile if applicable
    const contactManagerProfile = await this.getContactManagerProfile(user.id);

    // Get supervisor information if applicable
    const supervisor = await this.getSupervisorInfo(user.supervisorId);

    const userInfo: UserDebugInfo = {
      id: user.id,
      azureAdObjectId: user.azureAdObjectId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      roleChangedAt: user.roleChangedAt,
      supervisorId: user.supervisorId,
      assignedAt: user.assignedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt
    };

    return new GetUserDebugResponse(
      userInfo,
      roles,
      permissions,
      contactManagerProfile,
      supervisor
    );
  }

  /**
   * Gets role assignments for a user
   * @param userId - User ID
   * @returns Promise that resolves to array of role assignment info
   * @private
   */
  private async getRoleAssignments(userId: string): Promise<RoleAssignmentInfo[]> {
    const assignments = await this.userRoleAssignmentRepository.findActiveRoleAssignmentsByUserId(userId);
    
    return assignments.map(a => ({
      roleId: a.roleId,
      roleName: a.role.displayName || a.role.name,
      assignedAt: a.assignedAt
    }));
  }

  /**
   * Gets effective permissions for a user
   * @param azureAdObjectId - Azure AD Object ID
   * @returns Promise that resolves to array of permission info
   * @private
   */
  private async getPermissions(azureAdObjectId: string): Promise<PermissionInfo[]> {
    const permissionCodes = await this.userRepository.getEffectivePermissionCodesByAzureId(azureAdObjectId);
    
    if (permissionCodes.length === 0) {
      return [];
    }

    const permissions = await this.permissionRepository.findByCodes(permissionCodes, true);

    return permissions.map(p => ({
      code: p.code,
      name: p.name,
      resource: p.resource,
      action: p.action
    }));
  }

  /**
   * Gets Contact Manager profile if user is a Contact Manager
   * @param userId - User ID
   * @returns Promise that resolves to Contact Manager profile info or null
   * @private
   */
  private async getContactManagerProfile(userId: string): Promise<ContactManagerProfileInfo | null> {
    const profile = await this.userRepository.findContactManagerProfileByUserId(userId);
    
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      status: profile.status,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  /**
   * Gets supervisor information if user has a supervisor
   * @param supervisorId - Supervisor user ID
   * @returns Promise that resolves to supervisor info or null
   * @private
   */
  private async getSupervisorInfo(supervisorId: string | null): Promise<SupervisorInfo | null> {
    if (!supervisorId) {
      return null;
    }

    const supervisor = await this.userRepository.findById(supervisorId);
    
    if (!supervisor) {
      return null;
    }

    return {
      id: supervisor.id,
      azureAdObjectId: supervisor.azureAdObjectId,
      email: supervisor.email,
      fullName: supervisor.fullName
    };
  }
}

