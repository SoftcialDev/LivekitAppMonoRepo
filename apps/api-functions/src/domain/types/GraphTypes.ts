/**
 * @fileoverview GraphTypes - Type definitions for Microsoft Graph API
 * @summary Defines types and interfaces for Microsoft Graph operations
 * @description Encapsulates Microsoft Graph API data structures as types/interfaces
 */

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
 * App role assignment from Microsoft Graph
 */
export interface GraphAppRoleAssignment {
  id: string;
  principalId?: string;
  appRoleId?: string;
  resourceId?: string;
}

/**
 * Generic Graph API response with pagination support
 */
export interface GraphResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

/**
 * Chat member from Microsoft Graph
 */
export interface GraphChatMember {
  id: string;
  user?: {
    id: string;
  };
  roles?: string[];
}

