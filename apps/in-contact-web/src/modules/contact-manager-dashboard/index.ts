/**
 * @fileoverview Contact Manager Dashboard module barrel export
 * @summary Exports public API for Contact Manager Dashboard module
 * @description Provides access to Contact Manager Dashboard components, types, and utilities
 */

export { ContactManagerDashboardPage } from './pages';
export { contactManagerDashboardRoutes } from './routes';
export type {
  ContactManagerStatusResponse,
  UpdateContactManagerStatusRequest,
} from './types';
export { ManagerStatus } from './enums';
export { STATUS_OPTIONS } from './constants';
export {
  ContactManagerDashboardError,
  StatusFetchError,
  StatusUpdateError,
} from './errors';

