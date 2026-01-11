/**
 * @fileoverview Tables barrel export
 * @summary Re-exports all table components and types
 */

export { TableComponent } from './TableComponent';
export { TablePagination } from './TablePagination';
export { DataTable } from './DataTable';

export type { Column } from './TableComponent';

// Export sub-components
export { PaginationButton, TableCheckbox } from './components';
export type { IPaginationButtonProps, ITableCheckboxProps } from './components';

// Export types
export type {
  IColumn,
  ISelectionConfig,
  IInternalPaginationConfig,
  IExternalPaginationConfig,
  IIncrementalLoadConfig,
  ISearchConfig,
  ITablePaginationProps,
  ITableComponentProps,
  IDataTableProps,
} from './types';

// Export utilities
export {
  filterTableData,
  mergeDataWithoutDuplicates,
  calculatePageIndices,
} from './utils';

