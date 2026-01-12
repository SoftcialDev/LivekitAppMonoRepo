/**
 * @fileoverview TableComponent - Pure table rendering component
 * @summary Renders table structure with optional local pagination and search
 * @description Displays a table with columns, data, selection checkboxes, and loading state.
 * Can optionally handle pagination and search locally (client-side).
 */

import React from 'react';
import type { ITableComponentProps } from './types';
import { TablePagination } from './TablePagination';
import { TableSearchInput, TableHeader, TableBody } from './components';
import { useTableData } from './hooks/useTableData';

/**
 * TableComponent
 * 
 * Renders a table with:
 * - Header row with column headers
 * - Data rows with selection checkboxes
 * - Loading state with spinner
 * - Empty state when no data
 * 
 * @template T Row data type
 * @param props - Component props
 * @returns JSX element displaying the table
 */
export function TableComponent<T extends { id?: string }>(
  {
    columns,
    data,
    loading = false,
    loadingAction = 'Loading…',
    selection,
    headerBg = 'bg-[var(--color-primary-light)]',
    tablePadding = 'px-6 pt-10',
    enableLocalPagination = false,
    pageSize = 10,
    enableLocalSearch = false,
    searchPlaceholder = 'Search...',
  }: Readonly<ITableComponentProps<T>>
): JSX.Element {
  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    handlePageChange,
    displayData,
    filteredData,
    totalPages,
    allVisibleSelected,
    someVisibleSelected,
    handleToggleAll,
  } = useTableData({
    data,
    columns,
    enableLocalSearch,
    enableLocalPagination,
    pageSize,
    selection,
  });

  const showSelection = selection !== undefined;
  const { getRowKey = (row: T, idx: number) => String(row.id ?? idx) } = selection ?? {};
  const isModalMode = tablePadding === 'px-0 py-0';
  
  return (
    <div className={`flex flex-col h-full ${isModalMode ? '' : tablePadding}`}>
      {enableLocalSearch && (
        <TableSearchInput
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder={searchPlaceholder}
          isModalMode={isModalMode}
        />
      )}

      <div className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 ${isModalMode ? 'custom-scrollbar' : ''} ${isModalMode ? 'px-6' : ''}`}>
        <table className="w-full rounded-t-lg overflow-hidden border-b border-white">
          <TableHeader
            columns={columns}
            selection={selection}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            onToggleAll={handleToggleAll}
            headerBg={headerBg}
          />
          <TableBody
            displayData={displayData}
            columns={columns}
            selection={selection}
            getRowKey={getRowKey}
            loading={loading}
            loadingAction={loadingAction}
            showSelection={showSelection}
            isModalMode={isModalMode}
          />
        </table>
      </div>

      {enableLocalPagination && (
        <div className="shrink-0 px-6">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-primary);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-secondary);
          border-radius: 4px;
          border: 1px solid var(--color-primary);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-tertiary);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

// Export Column type alias for convenience
export type { IColumn as Column } from './types';
