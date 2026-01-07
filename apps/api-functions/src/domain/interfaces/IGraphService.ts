/**
 * @fileoverview IGraphService - Interface for Microsoft Graph operations
 * @description Defines the contract for Microsoft Graph API interactions
 */

/**
 * Interface for Microsoft Graph service operations.
 */
export interface IGraphService {
  /**
   * Gets an authentication token for Microsoft Graph API.
   * @returns Promise that resolves to the authentication token
   */
  getGraphToken(): Promise<string>;

  /**
   * Assigns an app role to a principal in Azure AD.
   * @param token - Authentication token
   * @param spId - Service principal ID
   * @param userId - User ID to assign role to
   * @param roleId - Role ID to assign
   * @returns Promise that resolves when role is assigned
   */
  assignAppRoleToPrincipal(token: string, spId: string, userId: string, roleId: string): Promise<void>;

  /**
   * Removes all app roles from a principal on a service principal.
   * @param token - Authentication token
   * @param spId - Service principal ID
   * @param userId - User ID to remove roles from
   * @returns Promise that resolves when roles are removed
   */
  removeAllAppRolesFromPrincipalOnSp(token: string, spId: string, userId: string): Promise<void>;

  /**
   * Fetches all users from Microsoft Graph.
   * @param token - Authentication token
   * @returns Promise that resolves to array of user objects
   */
  fetchAllUsers(token: string): Promise<any[]>;
}