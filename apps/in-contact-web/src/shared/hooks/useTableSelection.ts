/**
 * @fileoverview useTableSelection hook
 * @summary Hook for managing table row selection state
 * @description Provides reusable logic for table row selection with checkboxes
 */

import { useMemo, useCallback } from 'react';
import type { ISelectionConfig } from '@/ui-kit/tables/types/tableTypes';
import type { IUseTableSelectionParams } from './types/useTableSelectionTypes';

/**
 * Hook for managing table row selection state
 * 
 * Provides reusable logic for table row selection with checkboxes.
 * Returns a memoized selection configuration object that can be passed to DataTable.
 * 
 * @template T Type of each row data object
 * @param params - Configuration parameters for selection
 * @returns Memoized selection configuration object
 * 
 * @example
 * ```tsx
 * const [selectedIds, setSelectedIds] = useState<string[]>([]);
 * 
 * const selection = useTableSelection({
 *   selectedKeys: selectedIds,
 *   setSelectedKeys: setSelectedIds,
 *   getRowKey: (row: RecordingReport) => row.id,
 * });
 * 
 * <DataTable selection={selection} ... />
 * ```
 */
export function useTableSelection<T>({
  selectedKeys,
  setSelectedKeys,
  getRowKey,
}: IUseTableSelectionParams<T>): ISelectionConfig<T> {
  const handleToggleRow = useCallback(
    (key: string, checked: boolean) => {
      setSelectedKeys((prev) =>
        checked
          ? Array.from(new Set([...prev, key]))
          : prev.filter((k) => k !== key)
      );
    },
    [setSelectedKeys]
  );

  const handleToggleAll = useCallback(
    (checked: boolean, keys: string[]) => {
      setSelectedKeys((prev) =>
        checked
          ? Array.from(new Set([...prev, ...keys]))
          : prev.filter((k) => !keys.includes(k))
      );
    },
    [setSelectedKeys]
  );

  return useMemo<ISelectionConfig<T>>(
    () => ({
      selectedKeys,
      onToggleRow: handleToggleRow,
      onToggleAll: handleToggleAll,
      getRowKey,
    }),
    [selectedKeys, handleToggleRow, handleToggleAll, getRowKey]
  );
}

