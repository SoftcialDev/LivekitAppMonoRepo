/**
 * @fileoverview IGraphService - Domain interface for Microsoft Graph operations
 * @description Defines the contract for Microsoft Graph API operations
 */

import { UserRole } from '@prisma/client';

/**
 * Interface for Microsoft Graph service operations
 */
export interface IGraphService {
  /**
   * Gets a Microsoft Graph access token
   * @returns Promise that resolves to access token
   */
  getAccessToken(): Promise<string>;

  /**
   * Gets the service principal object ID for the application
   * @param accessToken - Microsoft Graph access token
   * @param clientId - Application client ID
   * @returns Promise that resolves to service principal object ID
   */
  getServicePrincipalObjectId(accessToken: string, clientId: string): Promise<string>;

  /**
   * Gets user information from Microsoft Graph
   * @param accessToken - Microsoft Graph access token
   * @param userEmail - User email address
   * @returns Promise that resolves to user information
   */
  getUserInfo(accessToken: string, userEmail: string): Promise<{
    id: string;
    displayName: string;
  }>;

  /**
   * Removes all app roles from a user
   * @param accessToken - Microsoft Graph access token
   * @param servicePrincipalId - Service principal object ID
   * @param userId - User object ID
   * @returns Promise that resolves when roles are removed
   */
  removeAllAppRoles(accessToken: string, servicePrincipalId: string, userId: string): Promise<void>;

  /**
   * Assigns an app role to a user
   * @param accessToken - Microsoft Graph access token
   * @param servicePrincipalId - Service principal object ID
   * @param userId - User object ID
   * @param roleId - Role ID to assign
   * @returns Promise that resolves when role is assigned
   */
  assignAppRole(accessToken: string, servicePrincipalId: string, userId: string, roleId: string): Promise<void>;

  /**
   * Gets the role ID for a given role
   * @param role - User role
   * @returns Role ID
   */
  getRoleId(role: UserRole): string;

  /**
   * Removes all app roles from a user
   * @param accessToken - Microsoft Graph access token
   * @param servicePrincipalId - Service principal object ID
   * @param userObjectId - User object ID
   * @returns Promise that resolves when roles are removed
   */
  removeAllAppRoles(accessToken: string, servicePrincipalId: string, userObjectId: string): Promise<void>;
}
