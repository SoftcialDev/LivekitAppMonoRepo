/**
 * @fileoverview Cell utilities - Helper functions for formatting table cell values
 * @summary Utility functions for formatting and rendering table cell values
 * @description Provides functions to format cell values for display in table cells
 */

import type React from 'react';
import type { IColumn } from '../types';

/**
 * Formats a cell value for display
 * 
 * Converts various value types to strings suitable for display:
 * - null/undefined -> empty string
 * - strings -> returned as-is
 * - objects -> JSON stringified
 * - other types -> converted to string
 * 
 * @param value - Value to format
 * @returns Formatted string value
 */
export function formatCellValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return value.toString();
  }
  // At this point, all types have been handled
  // Return empty string as safe fallback
  return '';
}

/**
 * Converts a cell value to string for search/filtering purposes
 * 
 * Similar to formatCellValue but optimized for search operations.
 * Returns empty string for null/undefined to skip in search.
 * 
 * @param cell - Cell value to convert
 * @returns String representation of the cell value
 */
export function cellValueToString(cell: unknown): string {
  if (cell == null) {
    return '';
  }
  if (typeof cell === 'string') {
    return cell;
  }
  if (typeof cell === 'object') {
    try {
      return JSON.stringify(cell);
    } catch {
      return '[object]';
    }
  }
  if (typeof cell === 'number' || typeof cell === 'boolean' || typeof cell === 'bigint') {
    return String(cell);
  }
  if (typeof cell === 'symbol') {
    return cell.toString();
  }
  if (typeof cell === 'function') {
    return cell.toString();
  }
  // At this point, all types have been handled
  // Return empty string as safe fallback
  return '';
}

/**
 * Gets cell value from row data based on column key
 * 
 * Handles both string keys and keyof T keys, returning the appropriate value.
 * 
 * @template T Row data type
 * @param row - Row data object
 * @param col - Column definition
 * @returns Cell value or null if not found
 */
export function getCellValue<T>(row: T, col: IColumn<T>): unknown {
  if (!col.key) {
    return null;
  }

  if (typeof col.key !== 'string') {
    return row[col.key];
  }

  if (col.key in (row as Record<string, unknown>)) {
    return (row as Record<string, unknown>)[col.key];
  }

  return null;
}

/**
 * Renders cell content based on column definition
 * 
 * Uses custom render function if provided, otherwise formats the cell value
 * based on the column key.
 * 
 * @template T Row data type
 * @param row - Row data object
 * @param col - Column definition
 * @returns React node to render in the cell
 */
export function renderCellContent<T>(row: T, col: IColumn<T>): React.ReactNode {
  if (col.render) {
    return col.render(row);
  }

  if (!col.key) {
    return '';
  }

  const value = getCellValue(row, col);
  return formatCellValue(value);
}

