/**
 * @fileoverview User Management Configuration Types
 * @summary Type definitions for configuring the generic user management factory
 * @description Defines interfaces for configuring the useUserManagementPage hook factory
 */

import type { IColumn as Column } from '@/ui-kit/tables/types';
import type { UserByRole } from './userManagementTypes';

/**
 * Base item type that all user management items must extend
 * Must have id field (optional) for DataTable compatibility
 */
export interface BaseUserManagementItem {
  /**
   * User email (used as unique identifier)
   */
  email: string;

  /**
   * First name
   */
  firstName: string;

  /**
   * Last name
   */
  lastName: string;

  /**
   * User role or display role
   */
  role?: string | null;

  /**
   * Optional ID field (for items that use ID for deletion, like SuperAdmin)
   * Required for DataTable compatibility
   */
  id?: string;

  /**
   * Optional azureAdObjectId
   */
  azureAdObjectId?: string;
}

/**
 * Candidate user type for add modal
 * Uses UserByRole which already has all required fields including optional id
 */
export type CandidateUser = UserByRole;

/**
 * Configuration for API functions
 */
export interface UserManagementApiConfig<T extends BaseUserManagementItem> {
  /**
   * Fetches initial total count of items (for pagination)
   *
   * @returns Promise resolving to total count of items
   */
  fetchTotalCount: () => Promise<number>;

  /**
   * Fetches items incrementally for pagination
   *
   * @param limit - Number of items to fetch
   * @param offset - Starting offset (0-based)
   * @returns Promise resolving to array of items for the requested range
   */
  onFetch: (limit: number, offset: number) => Promise<T[]>;

  /**
   * Fetches candidate users for the add modal
   *
   * @returns Promise resolving to array of candidate users
   */
  fetchCandidates: () => Promise<CandidateUser[]>;

  /**
   * Adds items by promoting selected candidates
   *
   * @param emails - Array of candidate emails to add
   * @returns Promise that resolves when operation completes
   */
  addItems: (emails: string[]) => Promise<void>;

  /**
   * Removes an item
   *
   * @param item - Item to remove
   * @returns Promise that resolves when operation completes
   */
  removeItem: (item: T) => Promise<void>;
}

/**
 * Configuration for UI labels and text
 */
export interface UserManagementUIConfig {
  /**
   * Page title (used in header)
   */
  title: string;

  /**
   * Label for the add button
   */
  addButtonLabel: string;

  /**
   * Modal title for add dialog
   */
  modalTitle: string;

  /**
   * Label for confirm button in add modal
   */
  confirmLabel: string;

  /**
   * Loading message when fetching items
   */
  loadingAction: string;

  /**
   * Loading message when fetching candidates
   */
  candidatesLoadingAction: string;

  /**
   * Success message template when adding items (use {count} placeholder)
   */
  addSuccessMessage: string;

  /**
   * Success message template when removing item (use {email} placeholder)
   */
  removeSuccessMessage: string;

  /**
   * Error message when fetching items fails
   */
  fetchErrorMessage: string;

  /**
   * Error message when adding items fails
   */
  addErrorMessage: string;

  /**
   * Error message when removing item fails
   */
  removeErrorMessage: string;
}

/**
 * Configuration for table columns
 */
export interface UserManagementColumnsConfig<T extends BaseUserManagementItem> {
  /**
   * Columns for the main items table
   */
  mainColumns: Column<T>[];

  /**
   * Columns for the candidates table in add modal
   */
  candidateColumns: Column<CandidateUser>[];
}

/**
 * Configuration for additional features
 */
export interface UserManagementFeaturesConfig {
  /**
   * Whether to show checkboxes in main table for batch operations
   *
   * @default false
   */
  showRowCheckboxes?: boolean;

  /**
   * Whether to enable supervisor filter (for PSO page)
   *
   * @default false
   */
  supervisorFilter?: boolean;

  /**
   * Whether to enable batch transfer feature (for PSO page)
   *
   * @default false
   */
  batchTransfer?: boolean;

  /**
   * Whether to show transfer button per row (for Supervisor page)
   *
   * @default false
   */
  transferButton?: boolean;

  /**
   * Minimum items required before allowing deletion (e.g., prevent deleting last SuperAdmin)
   *
   * @default 0 (no minimum)
   */
  minItemsForDeletion?: number;
}

/**
 * Complete configuration for user management page
 */
export interface UserManagementConfig<T extends BaseUserManagementItem> {
  /**
   * API configuration
   */
  api: UserManagementApiConfig<T>;

  /**
   * UI configuration
   */
  ui: UserManagementUIConfig;

  /**
   * Columns configuration
   */
  columns: UserManagementColumnsConfig<T>;

  /**
   * Optional features configuration
   */
  features?: UserManagementFeaturesConfig;
}

/**
 * Return type from useUserManagementPage hook
 */
export interface UseUserManagementPageReturn<T extends BaseUserManagementItem> {
  /**
   * Total count of items (from API, for pagination)
   * undefined = not loaded yet, 0 = no items, > 0 = has items
   */
  totalCount: number | undefined;

  /**
   * Function to fetch items incrementally
   *
   * @param limit - Number of items to fetch
   * @param offset - Starting offset (0-based)
   * @returns Promise resolving to array of items for the requested range
   */
  onFetch: (limit: number, offset: number) => Promise<T[]>;

  /**
   * Whether items are currently loading
   */
  itemsLoading: boolean;

  /**
   * Candidate users for add modal
   */
  candidates: CandidateUser[];

  /**
   * Whether candidates are currently loading
   */
  candidatesLoading: boolean;

  /**
   * Whether add modal is open
   */
  isModalOpen: boolean;

  /**
   * Currently selected candidate emails
   */
  selectedEmails: string[];

  /**
   * Opens the add modal and loads candidates
   */
  handleOpenModal: () => void;

  /**
   * Closes the add modal
   */
  handleCloseModal: () => void;

  /**
   * Adds selected candidates
   */
  handleConfirmAdd: () => Promise<void>;

  /**
   * Removes an item
   */
  handleRemove: (item: T) => Promise<void>;

  /**
   * Whether a remove operation is in progress
   */
  isRemoving: boolean;

  /**
   * Updates selected candidate emails
   */
  setSelectedEmails: (emails: string[]) => void;

  /**
   * Refreshes the items list
   */
  refreshItems: () => Promise<void>;

  /**
   * Refresh key to force DataTable remount
   */
  refreshKey: number;
}

/**
 * Props for UserManagementPage component
 */
export interface IUserManagementPageProps<T extends BaseUserManagementItem> {
  /**
   * Configuration for the page
   */
  config: UserManagementConfig<T>;

  /**
   * Hook return value from useUserManagementPage
   */
  hook: UseUserManagementPageReturn<T>;

  /**
   * Optional custom left toolbar actions (e.g., for PSO page with filters)
   * If provided, replaces the default Add button
   */
  customLeftToolbarActions?: React.ReactNode;

  /**
   * Optional custom selection config (e.g., for PSO page to track selected items for batch transfer)
   * If provided, replaces the default selection config
   */
  customSelection?: import('@/ui-kit/tables/types').ISelectionConfig<T>;
  
  /**
   * Optional external loading state (e.g., during transfer operations)
   * If provided, overrides internal loading state
   */
  externalLoading?: boolean;
  
  /**
   * Optional refresh key to force DataTable remount
   * When changed, forces DataTable to remount and reload data
   */
  refreshKey?: number;
  
  /**
   * Optional custom filter function for local filtering of loaded data
   * When provided, filters data locally instead of remounting and refetching from API
   */
  customFilter?: (data: T[]) => T[];
}

