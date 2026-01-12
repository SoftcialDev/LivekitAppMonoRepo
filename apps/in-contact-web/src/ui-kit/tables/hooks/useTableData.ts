/**
 * @fileoverview useTableData - Hook for table data management
 * @summary Manages filtering, pagination, and selection state for tables
 * @description Provides hooks for managing table data including local search, pagination, and selection
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { IUseTableDataOptions, IUseTableDataReturn, IColumn } from '../types';
import { cellValueToString } from '../utils/cellUtils';

/**
 * Hook for managing table data with search, pagination, and selection
 * 
 * Handles local search filtering, pagination, and selection state management.
 * 
 * @template T Row data type
 * @param options - Hook options
 * @returns Object containing data and handlers
 */
export function useTableData<T extends { id?: string }>(
  options: IUseTableDataOptions<T>
): IUseTableDataReturn<T> {
  const {
    data,
    columns,
    enableLocalSearch,
    enableLocalPagination,
    pageSize,
    selection,
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const showSelection = selection !== undefined;
  const {
    selectedKeys = [],
    onToggleAll: onToggleAllBase = () => {},
    getRowKey = (row: T, idx: number) => String(row.id ?? idx),
  } = selection ?? {};

  // Filter data based on search term if local search is enabled
  const filteredData = useMemo(() => {
    if (!enableLocalSearch || !searchTerm.trim()) {
      return data;
    }
    const term = searchTerm.toLowerCase();
    return data.filter((row: T) =>
      columns.some((col: IColumn<T>) => {
        if (!col.key) {
          return false;
        }
        const cell = typeof col.key === 'string' 
          ? (row as Record<string, unknown>)[col.key]
          : row[col.key];
        
        if (cell == null) {
          return false;
        }
        
        const cellValue = cellValueToString(cell);
        return cellValue.toLowerCase().includes(term);
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

  // Data to display (paginated or not)
  const displayData = enableLocalPagination ? paginatedData : filteredData;

  // Calculate total pages for local pagination
  const totalPages = useMemo(() => {
    if (!enableLocalPagination) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredData.length / pageSize));
  }, [filteredData.length, pageSize, enableLocalPagination]);

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
    showSelection ? displayData.map((row: T, idx: number) => getRowKey(row, idx)) : [],
    [displayData, getRowKey, showSelection]
  );

  // Header checkbox state - only calculate if selection is enabled
  const allVisibleSelected = useMemo(() =>
    showSelection && visibleRowKeys.length > 0 && visibleRowKeys.every((k: string) => selectedKeys.includes(k)),
    [visibleRowKeys, selectedKeys, showSelection]
  );

  const someVisibleSelected = useMemo(() =>
    showSelection && visibleRowKeys.some((k: string) => selectedKeys.includes(k)) && !allVisibleSelected,
    [visibleRowKeys, selectedKeys, allVisibleSelected, showSelection]
  );

  const handleToggleAll = useCallback((checked: boolean): void => {
    if (showSelection) {
      onToggleAllBase(checked, visibleRowKeys);
    }
  }, [showSelection, onToggleAllBase, visibleRowKeys]);

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    handlePageChange,
    filteredData,
    paginatedData,
    displayData,
    totalPages,
    visibleRowKeys,
    allVisibleSelected,
    someVisibleSelected,
    handleToggleAll,
  };
}

