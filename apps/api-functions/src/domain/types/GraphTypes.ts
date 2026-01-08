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

