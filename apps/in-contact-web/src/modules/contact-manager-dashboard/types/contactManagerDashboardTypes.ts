/**
 * @fileoverview Contact Manager Dashboard type definitions
 * @summary Type definitions for Contact Manager Dashboard
 * @description Defines interfaces and types for Contact Manager Dashboard page
 */

import type { ManagerStatus } from '@/modules/presence/enums/managerStatusEnums';

/**
 * Response from API when fetching current user's Contact Manager status
 */
export interface ContactManagerStatusResponse {
  /**
   * Profile record UUID
   */
  id: string;

  /**
   * The user's Azure AD object ID
   */
  userId: string;

  /**
   * The user's email address
   */
  email: string;

  /**
   * The user's full display name
   */
  fullName: string;

  /**
   * Current status
   */
  status: ManagerStatus;

  /**
   * When this profile was created
   */
  createdAt: string;

  /**
   * When this profile was last updated
   */
  updatedAt: string;
}

/**
 * Request payload to update Contact Manager status
 */
export interface UpdateContactManagerStatusRequest {
  /**
   * New status to set
   */
  status: ManagerStatus;
}

