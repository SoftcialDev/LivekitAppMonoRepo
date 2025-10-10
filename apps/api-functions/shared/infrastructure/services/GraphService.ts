/**
 * @fileoverview GraphService - Infrastructure service for Microsoft Graph operations
 * @description Implements Microsoft Graph API operations for Azure AD management
 */

import axios from 'axios';
import { UserRole } from '@prisma/client';
import { IGraphService } from '../../domain/interfaces/IGraphService';
import { getGraphToken, getServicePrincipalObjectId, removeAllAppRolesFromPrincipalOnSp, assignAppRoleToPrincipal } from '../../services/graphService';
import { config } from '../../config';

/**
 * Service for Microsoft Graph operations
 */
export class GraphService implements IGraphService {
  /**
   * Gets a Microsoft Graph access token
   * @returns Promise that resolves to access token
   */
  async getAccessToken(): Promise<string> {
    try {
      return await getGraphToken();
    } catch (error) {
      throw new Error(`Failed to get Graph token: ${(error as Error).message}`);
    }
  }

  /**
   * Gets the service principal object ID for the application
   * @param accessToken - Microsoft Graph access token
   * @param clientId - Application client ID
   * @returns Promise that resolves to service principal object ID
   */
  async getServicePrincipalObjectId(accessToken: string, clientId: string): Promise<string> {
    try {
      return await getServicePrincipalObjectId(accessToken, clientId);
    } catch (error) {
      throw new Error(`Failed to get service principal: ${(error as Error).message}`);
    }
  }

  /**
   * Gets user information from Microsoft Graph
   * @param accessToken - Microsoft Graph access token
   * @param userEmail - User email address
   * @returns Promise that resolves to user information
   */
  async getUserInfo(accessToken: string, userEmail: string): Promise<{ id: string; displayName: string }> {
    try {
      // Try direct user lookup first
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}?$select=id,displayName`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return {
        id: response.data.id,
        displayName: response.data.displayName || ''
      };
    } catch {
      // Fallback to search by email
      const fallback = await axios.get(
        `https://graph.microsoft.com/v1.0/users?$filter=mail eq '${userEmail}'&$select=id,displayName`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      if (!fallback.data.value?.length) {
        throw new Error(`User ${userEmail} not found in Microsoft Graph`);
      }
      
      return {
        id: fallback.data.value[0].id,
        displayName: fallback.data.value[0].displayName || ''
      };
    }
  }

  /**
   * Removes all app roles from a user
   * @param accessToken - Microsoft Graph access token
   * @param servicePrincipalId - Service principal object ID
   * @param userId - User object ID
   * @returns Promise that resolves when roles are removed
   */
  async removeAllAppRoles(accessToken: string, servicePrincipalId: string, userId: string): Promise<void> {
    try {
      await removeAllAppRolesFromPrincipalOnSp(accessToken, servicePrincipalId, userId);
    } catch (error) {
      throw new Error(`Failed to remove app roles: ${(error as Error).message}`);
    }
  }

  /**
   * Assigns an app role to a user
   * @param accessToken - Microsoft Graph access token
   * @param servicePrincipalId - Service principal object ID
   * @param userId - User object ID
   * @param roleId - Role ID to assign
   * @returns Promise that resolves when role is assigned
   */
  async assignAppRole(accessToken: string, servicePrincipalId: string, userId: string, roleId: string): Promise<void> {
    try {
      await assignAppRoleToPrincipal(accessToken, servicePrincipalId, userId, roleId);
    } catch (error) {
      throw new Error(`Failed to assign app role: ${(error as Error).message}`);
    }
  }

  /**
   * Gets the role ID for a given role
   * @param role - User role
   * @returns Role ID
   */
  getRoleId(role: UserRole): string {
    const roleIdMap: Record<UserRole, string> = {
      [UserRole.Unassigned]: '', // No role ID for unassigned users
      [UserRole.Supervisor]: config.supervisorsGroupId,
      [UserRole.Admin]: config.adminsGroupId,
      [UserRole.Employee]: config.employeesGroupId,
      [UserRole.ContactManager]: config.contactManagerAppRoleId,
      [UserRole.SuperAdmin]: config.superAdminAppRoleId!,
    };

    const roleId = roleIdMap[role];
    if (!roleId) {
      throw new Error(`Role ID not configured for role: ${role}`);
    }

    return roleId;
  }
}
