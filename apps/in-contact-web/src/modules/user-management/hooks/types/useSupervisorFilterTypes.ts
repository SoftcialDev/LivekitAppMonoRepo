/**
 * @fileoverview useSupervisorFilter Hook Types
 * @summary Type definitions for useSupervisorFilter hook
 */

import type { IDropdownOption } from '@/ui-kit/dropdown/types/searchableDropdownTypes';

/**
 * Options for supervisor filter dropdown
 */
export interface SupervisorFilterOptions {
  /**
   * Options for filter dropdown (uses supervisorAdId as value)
   */
  filterOptions: IDropdownOption<string>[];
  
  /**
   * Options for transfer dropdown (uses supervisorEmail as value)
   */
  transferOptions: IDropdownOption<string>[];
}

/**
 * Return type for useSupervisorFilter hook
 */
export interface UseSupervisorFilterReturn<T extends { supervisorAdId?: string; supervisorName?: string }> {
  /**
   * Currently selected supervisor IDs for filtering
   */
  filterSupervisorIds: string[];
  
  /**
   * Updates the selected supervisor IDs for filtering
   */
  setFilterSupervisorIds: (ids: string[]) => void;
  
  /**
   * Filtered items based on selected supervisors
   */
  filteredItems: T[];
  
  /**
   * Supervisor options for filter dropdown
   */
  filterOptions: IDropdownOption<string>[];
  
  /**
   * Supervisor options for transfer dropdown
   */
  transferOptions: IDropdownOption<string>[];
  
  /**
   * Whether supervisor options are loading
   */
  loading: boolean;
}

