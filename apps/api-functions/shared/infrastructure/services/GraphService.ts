/**
 * @fileoverview GraphService - Infrastructure service for Microsoft Graph operations
 * @description Implements Microsoft Graph API interactions
 */

import { IGraphService } from '../../domain/interfaces/IGraphService';
import {
  getGraphToken,
  assignAppRoleToPrincipal,
  removeAllAppRolesFromPrincipalOnSp,
  fetchAllUsers,
} from '../../services/graphService';

/**
 * Infrastructure service for Microsoft Graph operations.
 */
export class GraphService implements IGraphService {
  /**
   * Gets an authentication token for Microsoft Graph API.
   * @returns Promise that resolves to the authentication token
   */
  async getGraphToken(): Promise<string> {
    return await getGraphToken();
  }

  /**
   * Assigns an app role to a principal in Azure AD.
   * @param token - Authentication token
   * @param spId - Service principal ID
   * @param userId - User ID to assign role to
   * @param roleId - Role ID to assign
   * @returns Promise that resolves when role is assigned
   */
  async assignAppRoleToPrincipal(token: string, spId: string, userId: string, roleId: string): Promise<void> {
    return await assignAppRoleToPrincipal(token, spId, userId, roleId);
  }

  /**
   * Removes all app roles from a principal on a service principal.
   * @param token - Authentication token
   * @param spId - Service principal ID
   * @param userId - User ID to remove roles from
   * @returns Promise that resolves when roles are removed
   */
  async removeAllAppRolesFromPrincipalOnSp(token: string, spId: string, userId: string): Promise<void> {
    await removeAllAppRolesFromPrincipalOnSp(token, spId, userId);
  }

  /**
   * Fetches all users from Microsoft Graph.
   * @param token - Authentication token
   * @returns Promise that resolves to array of user objects
   */
  async fetchAllUsers(token: string): Promise<any[]> {
    return await fetchAllUsers(token);
  }
}