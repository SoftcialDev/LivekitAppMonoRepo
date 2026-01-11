/**
 * @fileoverview Contact Manager Types
 * @summary Type definitions for Contact Manager API responses and requests
 */

import type { ManagerStatus } from '@/modules/presence/enums/managerStatusEnums';

/**
 * Re-export ManagerStatus as ContactManagerStatus for consistency with API naming
 */
export type ContactManagerStatus = ManagerStatus;

/**
 * Contact Manager DTO returned by Contact Manager API (client-facing format)
 */
export interface ContactManagerDto {
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
  status: ContactManagerStatus;

  /**
   * When this profile was created (ISO string)
   */
  createdAt: string;

  /**
   * When this profile was last updated (ISO string)
   */
  updatedAt: string;
}

/**
 * Envelope returned by GET /api/contactManagers
 */
export interface ListContactManagersResponse {
  /**
   * Array of contact manager DTOs from the backend
   */
  contactManagers: ContactManagerDto[];
}

/**
 * Request payload for creating/updating a Contact Manager
 */
export interface CreateContactManagerRequest {
  /**
   * The user's email address
   */
  email: string;

  /**
   * Initial or new status
   */
  status: ContactManagerStatus;
}

