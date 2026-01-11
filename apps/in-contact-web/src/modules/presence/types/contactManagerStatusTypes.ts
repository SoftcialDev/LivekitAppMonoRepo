/**
 * @fileoverview Contact Manager Status types
 * @summary Type definitions for Contact Manager status updates
 * @description Types for Contact Manager status WebSocket updates and hook return values
 */

import type { ContactManagerDto } from '@/modules/user-management/types';
import type { ManagerStatus } from '../enums';

/**
 * Shape of a Contact Manager status-update event delivered via WebSocket
 */
export interface ContactManagerStatusUpdate {
  /** Unique identifier of the Contact Manager being updated */
  managerId: string;
  /** New status value for the Contact Manager */
  status: ManagerStatus;
  /** Optional ISO timestamp indicating when this status was set */
  updatedAt?: string;
  /** Optional channel/group indicator if your backend includes it */
  channel?: string;
}

/**
 * Hook return type for useContactManagerStatus
 */
export interface IUseContactManagerStatusReturn {
  /** Current list of Contact Managers */
  managers: ContactManagerDto[];
  /** True while a full list fetch is in progress */
  loading: boolean;
  /** Error from the last fetch or WebSocket setup, if any */
  error: Error | null;
  /** Manually re-fetches the full list */
  refresh: () => Promise<void>;
}

