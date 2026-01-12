/**
 * @fileoverview TableBody - Table body component
 * @summary Renders table body with rows, loading state, and empty state
 * @description Displays table rows, loading spinner, or empty state message
 */

import type { ITableBodyProps } from '../types';
import { Loading } from '@/ui-kit/feedback/Loading';
import { TableRow } from './TableRow';

/**
 * Table body component
 * 
 * Renders table body with rows, loading state, or empty state.
 * Handles display of data rows, loading spinner, and empty state message.
 * 
 * @template T Row data type
 * @param props - Component props
 * @returns JSX element containing the table body
 */
export function TableBody<T>({
  displayData,
  columns,
  selection,
  getRowKey,
  loading,
  loadingAction,
  showSelection,
  isModalMode,
}: Readonly<ITableBodyProps<T>>): JSX.Element {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td 
            colSpan={(showSelection ? 1 : 0) + columns.length} 
            className="relative px-6 py-16 text-center min-h-[200px]"
          >
            <Loading action={loadingAction} bgClassName="bg-transparent" />
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {displayData.map((row, idx) => {
        const rowKey = getRowKey(row, idx);
        return (
          <TableRow
            key={rowKey}
            row={row}
            rowIndex={idx}
            columns={columns}
            selection={selection}
            rowKey={rowKey}
            isModalMode={isModalMode}
          />
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
    </tbody>
  );
}

