/**
 * @fileoverview GraphService - Infrastructure service for Microsoft Graph operations
 * @description Implements Microsoft Graph API interactions
 */

import axios from "axios";
import qs from "qs";
import { config } from '../../config';
import { IGraphService } from '../../domain/interfaces/IGraphService';

/**
 * Minimal user data from Microsoft Graph
 */
export interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

/**
 * Infrastructure service for Microsoft Graph operations.
 */
export class GraphService implements IGraphService {
  /**
   * Acquire an access token for Microsoft Graph using client credentials flow
   * @returns Promise that resolves to the bearer token string
   */
  async getGraphToken(): Promise<string> {
    const tenantId = config.azureTenantId;
    const clientId = config.azureClientId;
    const clientSecret = config.azureClientSecret;
    
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Missing Azure AD config: azureTenantId, azureClientId, or azureClientSecret"
      );
    }
    
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = {
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    };
    
    try {
      const resp = await axios.post(tokenUrl, qs.stringify(params), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      
      const accessToken = resp.data?.access_token;
      if (!accessToken) {
        throw new Error(
          `Token response did not contain access_token. Response: ${JSON.stringify(resp.data)}`
        );
      }
      
      return accessToken as string;
    } catch (err: any) {
      if (err.response) {
        throw new Error(
          `Failed to acquire Graph token: HTTP ${err.response.status} - ${JSON.stringify(err.response.data)}`
        );
      }
      throw new Error(`Failed to acquire Graph token: ${err.message}`);
    }
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
    await axios.post(
      `https://graph.microsoft.com/v1.0/servicePrincipals/${spId}/appRoleAssignedTo`,
      {
        principalId: userId,
        resourceId: spId,
        appRoleId: roleId,
      },
      { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }

  /**
   * Removes all app roles from a principal on a service principal.
   * @param token - Authentication token
   * @param spId - Service principal ID
   * @param userId - User ID to remove roles from
   * @returns Promise that resolves when roles are removed
   */
  async removeAllAppRolesFromPrincipalOnSp(token: string, spId: string, userId: string): Promise<void> {
    const base = `https://graph.microsoft.com/v1.0/servicePrincipals/${spId}/appRoleAssignedTo`;
    let url = `${base}?$top=100`;

    while (url) {
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (resp.status !== 200) {
        throw new Error(`Failed to list appRoleAssignedTo: ${resp.status} ${JSON.stringify(resp.data)}`);
      }

      const page: Array<{ id: string; principalId?: string }> = resp.data?.value ?? [];
      for (const a of page) {
        if (!a?.id) continue;
        if ((a as any).principalId !== userId) continue;

        const delUrl = `${base}/${a.id}`;
        try {
          await axios.delete(delUrl, { 
            headers: { Authorization: `Bearer ${token}` } 
          });
        } catch (err: any) {
          const detail = err?.response
            ? `HTTP ${err.response.status} - ${JSON.stringify(err.response.data)}`
            : err?.message;
          throw new Error(`Failed to delete appRoleAssignedTo ${a.id}: ${detail}`);
        }
      }

      url = resp.data?.["@odata.nextLink"] || "";
    }
  }

  /**
   * Fetches all users from Microsoft Graph.
   * @param token - Authentication token
   * @returns Promise that resolves to array of user objects
   */
  async fetchAllUsers(token: string): Promise<GraphUser[]> {
    const users: GraphUser[] = [];
    let url = "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,accountEnabled&$top=100";
    
    while (url) {
      try {
        const resp = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (resp.status !== 200) {
          throw new Error(
            `Graph /users returned status ${resp.status}: ${JSON.stringify(resp.data)}`
          );
        }
        
        const data = resp.data as any;
        if (Array.isArray(data.value)) {
          users.push(...data.value);
        }
        url = data["@odata.nextLink"] || "";
      } catch (err: any) {
        if (err.response) {
          throw new Error(
            `Error fetching users: HTTP ${err.response.status} - ${JSON.stringify(err.response.data)}`
          );
        }
        throw new Error(`Error fetching users: ${err.message}`);
      }
    }
    
    return users;
  }

  /**
   * Fetches app role member IDs
   * @param token - Bearer token for authentication
   * @param servicePrincipalId - Service Principal ID
   * @param appRoleId - App Role ID
   * @returns Promise that resolves to set of member IDs
   */
  async fetchAppRoleMemberIds(token: string, servicePrincipalId: string, appRoleId: string): Promise<Set<string>> {
    if (!servicePrincipalId) throw new Error("servicePrincipalId is required");
    if (!appRoleId) throw new Error("appRoleId is required");

    const memberIds = new Set<string>();
    let url = `https://graph.microsoft.com/v1.0/servicePrincipals/${servicePrincipalId}/appRoleAssignedTo?$top=100`;

    while (url) {
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (resp.status !== 200) {
        throw new Error(`Graph failed: ${resp.status} – ${JSON.stringify(resp.data)}`);
      }
      
      const data = resp.data as any;

      for (const assignment of data.value || []) {
        if (assignment.appRoleId === appRoleId && assignment.principalId) {
          memberIds.add(assignment.principalId as string);
        }
      }

      url = data["@odata.nextLink"] || "";
    }

    return memberIds;
  }
}