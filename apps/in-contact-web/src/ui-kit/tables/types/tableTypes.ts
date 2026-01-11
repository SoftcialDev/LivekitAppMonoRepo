/**
 * @fileoverview Table component type definitions
 * @summary Type definitions for table components
 * @description Defines interfaces and types for table, pagination, and data table components
 */

import type React from 'react';

/**
 * Column metadata for a generic table
 * 
 * @template T Type of each row data object
 */
export interface IColumn<T> {
  /**
   * Header text to display at the top of the column
   */
  header: string;

  /**
   * Key of the row object to display when no custom render is provided.
   * If you use a `render` function, this can be omitted.
   */
  key?: keyof T | string;

  /**
   * Optional custom cell renderer
   * 
   * @param row - The full row data object
   * @returns A React node to render inside this cell
   */
  render?: (row: T) => React.ReactNode;

  /**
   * Optional custom className for the cell (td element).
   * Useful for overriding default whitespace-nowrap behavior.
   */
  cellClassName?: string;
}

/**
 * Configuration for row selection
 * 
 * @template T Type of each row data object
 */
export interface ISelectionConfig<T> {
  /**
   * Currently selected row keys
   */
  selectedKeys: string[];

  /**
   * Toggle a single row selection
   * 
   * @param rowKey - Unique key of the row
   * @param checked - Whether the row is now checked
   */
  onToggleRow: (rowKey: string, checked: boolean) => void;

  /**
   * Toggle all visible rows selection
   * 
   * @param checked - Whether all rows are now checked
   * @param visibleRowKeys - Array of keys for currently visible rows
   */
  onToggleAll: (checked: boolean, visibleRowKeys: string[]) => void;

  /**
   * Return a stable unique key for a row (used by selection)
   * 
   * @param row - The row data object
   * @param index - The index of the row in the data array
   * @returns Unique string key for the row
   */
  getRowKey: (row: T, index: number) => string;
}

/**
 * Pagination configuration for internal pagination
 */
export interface IInternalPaginationConfig {
  /**
   * Number of rows per page
   * 
   * @default 8
   */
  pageSize?: number;
}

/**
 * Pagination configuration for external/server-side pagination
 */
export interface IExternalPaginationConfig {
  /**
   * Current page number (1-based)
   */
  currentPage: number;

  /**
   * Total number of pages available
   */
  totalPages: number;

  /**
   * Total number of items across all pages
   */
  totalItems: number;

  /**
   * Callback when page changes
   * 
   * @param page - New page number (1-based)
   */
  onPageChange: (page: number) => void;
}

/**
 * Incremental data loading configuration
 */
export interface IIncrementalLoadConfig {
  /**
   * Initial number of records to fetch from API
   * 
   * @default 80
   */
  initialFetchSize?: number;

  /**
   * Number of additional records to fetch when more data is needed
   * 
   * @default 80
   */
  fetchSize?: number;

  /**
   * Function to fetch data from API
   * 
   * @param limit - Number of records to fetch
   * @param offset - Starting offset for the fetch
   * @returns Promise with fetched data and total count
   */
  onFetch: (
    limit: number,
    offset: number
  ) => Promise<{
    data: unknown[];
    total: number;
    count: number;
  }>;

  /**
   * Total number of records available from API (used to calculate total pages)
   * undefined = not loaded yet (show loading), 0 = no items (show "no results"), > 0 = has items
   */
  totalCount: number | undefined;
}

/**
 * Search configuration
 */
export interface ISearchConfig {
  /**
   * Whether search is enabled
   * 
   * @default true
   */
  enabled?: boolean;

  /**
   * Placeholder text for search input
   * 
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Callback when search term changes (for external/search)
   * If not provided, uses internal filtering
   * 
   * @param term - Current search term
   */
  onSearch?: (term: string) => void;
}

/**
 * Props for TablePagination component
 */
export interface ITablePaginationProps {
  /**
   * Current page number (1-based)
   */
  currentPage: number;

  /**
   * Total number of pages available
   */
  totalPages: number;

  /**
   * Total number of items across all pages (optional, for display)
   */
  totalItems?: number;

  /**
   * Number of items per page (optional, for display)
   */
  pageSize?: number;

  /**
   * Callback when page changes
   * 
   * @param page - New page number (1-based)
   */
  onPageChange: (page: number) => void;

  /**
   * Whether pagination controls are disabled
   * 
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for PaginationButton component
 */
export interface IPaginationButtonProps {
  /**
   * Button label text
   */
  label: string;

  /**
   * Click handler function
   */
  onClick: () => void;

  /**
   * Whether the button is disabled
   * 
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for TableComponent
 * 
 * @template T Type of each row data object
 */
export interface ITableComponentProps<T> {
  /**
   * Column definitions
   */
  columns: IColumn<T>[];

  /**
   * Array of row data to display
   */
  data: T[];

  /**
   * Whether the table is in loading state
   * 
   * @default false
   */
  loading?: boolean;

  /**
   * Text to display under the spinner when loading
   * 
   * @default "Loading…"
   */
  loadingAction?: string;

  /**
   * Selection configuration (checkboxes always visible)
   * If not provided, no checkboxes will be shown
   */
  selection?: ISelectionConfig<T>;

  /**
   * Overrides the background CSS class for the `<th>` row
   * 
   * @default "bg-[var(--color-primary-light)]"
   */
  headerBg?: string;

  /**
   * Overrides the padding CSS class for the table container
   * 
   * @default "p-30"
   */
  tablePadding?: string;

  /**
   * Enable local pagination (client-side)
   * When enabled, the table will paginate the data array locally
   * 
   * @default false
   */
  enableLocalPagination?: boolean;

  /**
   * Number of rows per page for local pagination
   * 
   * @default 10
   */
  pageSize?: number;

  /**
   * Enable local search (client-side filtering)
   * When enabled, a search input will be rendered
   * 
   * @default false
   */
  enableLocalSearch?: boolean;

  /**
   * Placeholder text for search input
   * 
   * @default "Search..."
   */
  searchPlaceholder?: string;
}

/**
 * Props for TableCheckbox component
 */
export interface ITableCheckboxProps {
  /**
   * Whether the checkbox is checked
   */
  checked: boolean;

  /**
   * Whether the checkbox is in indeterminate state (for header "select all" checkbox)
   * 
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Change handler function
   * 
   * @param checked - Whether the checkbox is now checked
   */
  onChange: (checked: boolean) => void;

  /**
   * Whether the checkbox is disabled
   * 
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for DataTable component
 * 
 * Configuration for the composite DataTable component that combines table rendering,
 * incremental data loading, pagination, and search functionality.
 * 
 * @template T Type of each row data object
 */
export interface IDataTableProps<T> {
  /**
   * Column definitions for the table
   * 
   * Each column defines how to display and search data in that column.
   */
  columns: IColumn<T>[];

  /**
   * Incremental data loading configuration
   * 
   * Defines how data is fetched from the API, including initial fetch size,
   * incremental fetch size, and the fetch callback function.
   */
  dataLoader: IIncrementalLoadConfig;

  /**
   * Selection configuration (checkboxes always visible)
   * 
   * Manages row selection state, including selected keys, toggle handlers,
   * and row key generation function.
   * If not provided, checkboxes are not displayed.
   */
  selection?: ISelectionConfig<T>;

  /**
   * Search configuration
   * 
   * Controls search behavior. Can use internal filtering (searches loaded data)
   * or external search (delegates to parent component via onSearch callback).
   * 
   * @default { enabled: true }
   */
  search?: ISearchConfig;

  /**
   * Number of rows to display per page
   * 
   * Controls how many rows are shown in the table before pagination occurs.
   * 
   * @default 8
   */
  pageSize?: number;

  /**
   * Custom toolbar actions on the left side of the toolbar
   * 
   * Typically used for action buttons like "Delete Selected", "Add", etc.
   * Replaces any default left-side controls.
   */
  leftToolbarActions?: React.ReactNode;

  /**
   * Custom actions to render on the right side of the toolbar (next to search)
   * 
   * Additional controls that appear to the right of the search input.
   */
  rightToolbarActions?: React.ReactNode;

  /**
   * Overrides the background CSS class for the table header row (`<th>` elements)
   * 
   * @default "bg-[var(--color-primary-light)]"
   */
  headerBg?: string;

  /**
   * Overrides the padding CSS class for the table container
   * 
   * @default "p-30"
   */
  tablePadding?: string;

  /**
   * External loading state override
   * 
   * When provided, this takes precedence over internal loading state.
   * Useful for showing loading state during external operations like migrations.
   * 
   * @default undefined
   */
  externalLoading?: boolean;

  /**
   * Loading message to display when externalLoading is true
   * 
   * @default "Loading data"
   */
  externalLoadingAction?: string;
  
  /**
   * Custom filter function for local filtering of loaded data
   * 
   * When provided, filters allData locally before displaying.
   * This is more efficient than remounting and refetching from the API.
   * The filter function receives the data array and returns the filtered array.
   * 
   * @param data - Array of all loaded data
   * @returns Filtered array of data
   */
  customFilter?: (data: T[]) => T[];
}

