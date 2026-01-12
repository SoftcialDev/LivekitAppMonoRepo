/**
 * @fileoverview useSupervisorFilter hook
 * @summary Hook for filtering PSOs by supervisor
 * @description Manages supervisor filter state and provides filtered PSO list
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getUsersByRole } from '../api/adminClient';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import type { UserByRole } from '../types';
import type { IDropdownOption } from '@/ui-kit/dropdown/types/searchableDropdownTypes';
import type { UseSupervisorFilterReturn, SupervisorFilterOptions } from './types/useSupervisorFilterTypes';

/**
 * Hook for filtering items by supervisor
 * 
 * Manages supervisor filter state and provides filtered items based on selected supervisors.
 * Also fetches supervisor options for dropdowns.
 * 
 * @template T - Type of items being filtered (must have supervisorAdId and supervisorName)
 * @param allItems - All items to filter
 * @returns Object with filter state and filtered items
 */
export function useSupervisorFilter<T extends { supervisorAdId?: string; supervisorName?: string }>(
  allItems: T[]
): UseSupervisorFilterReturn<T> {
  const { showToast } = useToast();
  const [filterSupervisorIds, setFilterSupervisorIds] = useState<string[]>([]);
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorFilterOptions>({
    filterOptions: [],
    transferOptions: [],
  });
  const [loading, setLoading] = useState(false);

  // Fetch supervisors for dropdowns
  const fetchSupervisors = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await getUsersByRole('Supervisor', 1, 500);
      const filterOpts: IDropdownOption<string>[] = response.users.map((s: UserByRole) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.azureAdObjectId || s.email,
      }));
      const transferOpts: IDropdownOption<string>[] = response.users.map((s: UserByRole) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.email,
      }));
      setSupervisorOptions({
        filterOptions: filterOpts,
        transferOptions: transferOpts,
      });
    } catch (error) {
      logError('Failed to fetch supervisors for filter', { error });
      showToast('Failed to load supervisors', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load supervisors on mount (only once)
  useEffect(() => {
    fetchSupervisors().catch((err) => {
      logError('Error in fetchSupervisors effect', { error: err });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps array to ensure it only runs once on mount

  // Filter items based on selected supervisor IDs
  const filteredItems = useMemo(() => {
    if (filterSupervisorIds.length === 0) {
      return allItems;
    }
    const allowSet = new Set(filterSupervisorIds);
    return allItems.filter(
      (item) => item.supervisorAdId && allowSet.has(item.supervisorAdId)
    );
  }, [allItems, filterSupervisorIds]);

  return {
    filterSupervisorIds,
    setFilterSupervisorIds,
    filteredItems,
    filterOptions: supervisorOptions.filterOptions,
    transferOptions: supervisorOptions.transferOptions,
    loading,
  };
}
