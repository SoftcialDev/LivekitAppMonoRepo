/**
 * @fileoverview Presence API client
 */

import { logError } from '@/shared/utils/logger';
import { PresenceSnapshotError } from '../errors';
import { PRESENCE_MAX_INITIAL_USERS } from '../constants/presenceConstants';
import type {
  PresenceSnapshotResponse,
  FetchPresenceOptions,
} from '../types/presenceTypes';
import {
  collectAllPresenceItems,
  separateUsersByStatus,
} from './utils/presenceApiUtils';

/**
 * Fetches presence snapshot from the backend
 * 
 * Paginates through all pages and collects users. Defaults to loading all users
 * (online and offline) up to PRESENCE_MAX_INITIAL_USERS limit.
 * 
 * @param options - Optional fetch configuration
 * @returns Promise resolving to presence snapshot with online and offline users
 * @throws {PresenceSnapshotError} when HTTP request fails
 */
export async function fetchPresence(
  options?: FetchPresenceOptions
): Promise<PresenceSnapshotResponse> {
  const {
    onlyOnline = false,
    maxUsers = PRESENCE_MAX_INITIAL_USERS,
  } = options ?? {};

  try {
    const allItems = await collectAllPresenceItems(onlyOnline, maxUsers);
    return separateUsersByStatus(allItems);
  } catch (error: unknown) {
    logError('Failed to fetch presence snapshot', { error });

    if (error instanceof Error) {
      throw new PresenceSnapshotError('Failed to fetch presence snapshot', error);
    }

    throw new PresenceSnapshotError('Failed to fetch presence snapshot');
  }
}

