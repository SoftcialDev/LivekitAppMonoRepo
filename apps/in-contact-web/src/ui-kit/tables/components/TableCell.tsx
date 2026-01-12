/**
 * @fileoverview TableCell - Table cell component
 * @summary Renders a single table cell with formatted content
 * @description Displays cell content based on column definition, handling custom renderers and value formatting
 */

import type { ITableCellProps } from '../types';
import { renderCellContent } from '../utils/cellUtils';

/**
 * Table cell component
 * 
 * Renders a single table cell with content formatted based on the column definition.
 * Handles custom render functions and value formatting.
 * 
 * @template T Row data type
 * @param props - Component props
 * @returns JSX element containing the table cell
 */
export function TableCell<T>({
  row,
  column,
  rowIndex,
  columnIndex,
  isModalMode,
}: Readonly<ITableCellProps<T>>): JSX.Element {
  const cellContent = renderCellContent(row, column);

  return (
    <td
      className={`${isModalMode ? 'px-0' : 'px-6'} py-4 text-sm text-white ${column.cellClassName || 'whitespace-nowrap'}`}
    >
      {cellContent}
    </td>
  );
}

