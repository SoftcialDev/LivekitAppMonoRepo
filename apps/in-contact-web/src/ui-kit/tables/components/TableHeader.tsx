/**
 * @fileoverview TableHeader - Table header component
 * @summary Renders table header row with column headers and selection checkbox
 * @description Displays table header with column titles and optional "select all" checkbox
 */

import React from 'react';
import type { ITableHeaderProps } from '../types';
import { TableCheckbox } from './TableCheckbox';

/**
 * Table header component
 * 
 * Renders the table header row with column titles and optional "select all" checkbox.
 * 
 * @template T Row data type
 * @param props - Component props
 * @returns JSX element containing the table header
 */
export function TableHeader<T>({
  columns,
  selection,
  allVisibleSelected,
  someVisibleSelected,
  onToggleAll,
  headerBg,
}: Readonly<ITableHeaderProps<T>>): JSX.Element {
  const showSelection = selection !== undefined;

  return (
    <thead>
      <tr>
        {showSelection && (
          <th className={`px-3 py-3 text-left text-sm font-semibold ${headerBg} text-white rounded-tl-lg rounded-bl-lg w-[50px]`}>
            <div className="flex items-center justify-start">
              <TableCheckbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected}
                onChange={onToggleAll}
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
  );
}

