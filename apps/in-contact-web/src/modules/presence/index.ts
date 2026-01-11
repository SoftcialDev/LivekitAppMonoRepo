/**
 * @fileoverview Presence module barrel export
 * @summary Exports all presence module components
 */

// Stores
export * from './stores/presence-store';

// API
export { fetchPresence } from './api/presenceApi';
export { PresenceClient } from './api/presenceClient';

// Types
export type * from './types/presenceTypes';
export type * from './types/contactManagerStatusTypes';

// Enums
export { PresenceStatus, ManagerStatus } from './enums';

// Constants
export {
  PRESENCE_PAGE_SIZE,
  PRESENCE_MAX_INITIAL_USERS,
} from './constants/presenceConstants';

// Errors
export * from './errors';

// Hooks
export * from './hooks';

