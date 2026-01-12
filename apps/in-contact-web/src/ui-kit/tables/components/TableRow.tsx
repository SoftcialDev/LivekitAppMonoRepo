/**
 * @fileoverview TableRow - Table row component
 * @summary Renders a single table row with cells and selection checkbox
 * @description Displays a table row with data cells and optional selection checkbox
 */

import type { ITableRowProps } from '../types';
import { TableCheckbox } from './TableCheckbox';
import { TableCell } from './TableCell';

/**
 * Table row component
 * 
 * Renders a single table row with data cells and optional selection checkbox.
 * 
 * @template T Row data type
 * @param props - Component props
 * @returns JSX element containing the table row
 */
export function TableRow<T>({
  row,
  rowIndex,
  columns,
  selection,
  rowKey,
  isModalMode,
}: Readonly<ITableRowProps<T>>): JSX.Element {
  const showSelection = selection !== undefined;
  const { selectedKeys = [], onToggleRow = () => {} } = selection ?? {};

  return (
    <tr
      className={rowIndex > 0 ? 'border-t border-white' : ''}
    >
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
        <TableCell
          key={`${String(col.key ?? col.header)}-${rowIndex}-${colIdx}`}
          row={row}
          column={col}
          rowIndex={rowIndex}
          columnIndex={colIdx}
          isModalMode={isModalMode}
        />
      ))}
    </tr>
  );
}

