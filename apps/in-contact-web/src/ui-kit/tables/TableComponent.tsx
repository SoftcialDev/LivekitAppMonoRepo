/**
 * @fileoverview TableComponent - Pure table rendering component
 * @summary Renders table structure with optional local pagination and search
 * @description Displays a table with columns, data, selection checkboxes, and loading state.
 * Can optionally handle pagination and search locally (client-side).
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import type { ITableComponentProps } from './types';
import { TableCheckbox } from './components/TableCheckbox';
import { Loading } from '@/ui-kit/feedback/Loading';
import { TablePagination } from './TablePagination';

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
  }: ITableComponentProps<T>
): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const showSelection = selection !== undefined;
  const { selectedKeys = [], onToggleRow = () => {}, onToggleAll = () => {}, getRowKey = (row: T, idx: number) => String(row.id ?? idx) } = selection ?? {};

  // Filter data based on search term if local search is enabled
  const filteredData = useMemo(() => {
    if (!enableLocalSearch || !searchTerm.trim()) {
      return data;
    }
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        if (col.key) {
          const cell = typeof col.key === 'string' 
            ? (row as Record<string, unknown>)[col.key]
            : row[col.key as keyof T];
          return cell != null && String(cell).toLowerCase().includes(term);
        }
        return false;
      })
    );
  }, [data, columns, searchTerm, enableLocalSearch]);

  // Paginate data if local pagination is enabled
  const paginatedData = useMemo(() => {
    if (!enableLocalPagination) {
      return filteredData;
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, enableLocalPagination]);

  // Calculate total pages for local pagination
  const totalPages = useMemo(() => {
    if (!enableLocalPagination) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredData.length / pageSize));
  }, [filteredData.length, pageSize, enableLocalPagination]);

  // Data to display (paginated or not)
  const displayData = enableLocalPagination ? paginatedData : filteredData;

  // Handle page change for local pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (enableLocalPagination && searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm, enableLocalPagination]);

  // Calculate visibleRowKeys based on displayData for selection
  const visibleRowKeys = useMemo(() =>
    showSelection ? displayData.map((row, idx) => getRowKey(row, idx)) : [],
    [displayData, getRowKey, showSelection]
  );

  // Header checkbox state - only calculate if selection is enabled
  const allVisibleSelected = useMemo(() =>
    showSelection && visibleRowKeys.length > 0 && visibleRowKeys.every(k => selectedKeys.includes(k)),
    [visibleRowKeys, selectedKeys, showSelection]
  );

  const someVisibleSelected = useMemo(() =>
    showSelection && visibleRowKeys.some(k => selectedKeys.includes(k)) && !allVisibleSelected,
    [visibleRowKeys, selectedKeys, allVisibleSelected, showSelection]
  );

  const handleToggleAll = (checked: boolean): void => {
    if (showSelection) {
      onToggleAll(checked, visibleRowKeys);
    }
  };

  const isModalMode = tablePadding === 'px-0 py-0';
  
  return (
    <div className={`flex flex-col h-full ${isModalMode ? '' : tablePadding}`}>
      {/* Search input - only show if local search is enabled */}
      {enableLocalSearch && (
        <div className={`mb-4 shrink-0 flex justify-start w-full ${isModalMode ? 'px-6 pt-4' : 'px-6'}`}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-(--color-primary) text-white rounded border-transparent focus:outline-none w-48"
          />
        </div>
      )}

      <div className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 ${isModalMode ? 'custom-scrollbar' : ''} ${isModalMode ? 'px-6' : ''}`}>
        <table className="w-full rounded-t-lg overflow-hidden border-b border-white">
        <thead>
          <tr>
            {/* Selection checkbox column - only show if selection is provided */}
            {showSelection && (
              <th className={`px-3 py-3 text-left text-sm font-semibold ${headerBg} text-white rounded-tl-lg rounded-bl-lg w-[50px]`}>
                <div className="flex items-center justify-start">
                  <TableCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={handleToggleAll}
                  />
                </div>
              </th>
            )}
            {columns.map((col, i) => {
              const isLast = i === columns.length - 1;
              return (
                <th
                  key={`${String(col.key ?? col.header)}-hdr-${i}`}
                  className={`
                    px-6 py-3 
                    text-left 
                    text-sm 
                    font-semibold
                    ${headerBg} 
                    text-white
                    ${isLast ? 'rounded-tr-lg rounded-br-lg' : ''}
                  `}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td 
                colSpan={(showSelection ? 1 : 0) + columns.length} 
                className="relative px-6 py-16 text-center min-h-[200px]"
              >
                <Loading action={loadingAction} bgClassName="bg-transparent" />
              </td>
            </tr>
          ) : (
            <>
              {displayData.map((row, idx) => {
                const rowKey = getRowKey(row, idx);
                return (
                  <tr
                    key={rowKey}
                    className={idx > 0 ? 'border-t border-white' : ''}
                  >
                    {/* Selection checkbox - only show if selection is provided */}
                    {showSelection && (
                      <td className="px-3 py-3 w-[50px]">
                        <div className="flex items-center justify-start">
                          <TableCheckbox
                            checked={selectedKeys.includes(rowKey)}
                            onChange={(checked) => onToggleRow(rowKey, checked)}
                          />
                        </div>
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td
                        key={`${String(col.key ?? col.header)}-${idx}-${colIdx}`}
                        className={`${isModalMode ? 'px-0' : 'px-6'} py-4 text-sm text-white ${col.cellClassName || 'whitespace-nowrap'}`}
                      >
                        {col.render
                          ? col.render(row)
                          : col.key && typeof col.key !== 'string'
                          ? String(row[col.key as keyof T] ?? '')
                          : col.key &&
                            typeof col.key === 'string' &&
                            col.key in row
                          ? String((row as Record<string, unknown>)[col.key] ?? '')
                          : ''}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {displayData.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={(showSelection ? 1 : 0) + columns.length}
                    className="px-6 py-4 text-center text-sm text-white"
                  >
                    No results found.
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
      </div>

      {/* Pagination - only show if local pagination is enabled */}
      {enableLocalPagination && (
        <div className={`shrink-0 ${isModalMode ? 'px-6' : 'px-6'}`}>
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
      
      {/* Custom scrollbar styles */}
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

