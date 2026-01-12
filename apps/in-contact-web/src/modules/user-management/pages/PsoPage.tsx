/**
 * @fileoverview PsoPage component
 * @summary PSO user management page with supervisor filter and batch transfer
 * @description Specialized page for managing PSOs with supervisor filtering and batch transfer functionality
 * Uses the same incremental pagination strategy as Admin/SuperAdmin pages.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useUserManagementPage, usePsoTransfer, useSupervisorFilter } from '../hooks';
import { UserManagementPage } from '../components';
import { createPsoPageConfig } from './config/psoPageConfig';
import type { PsoItem } from '../types';
import { AddButton } from '@/ui-kit/buttons';
import { SearchableDropdown } from '@/ui-kit/dropdown';
import { ConfirmModal } from '@/ui-kit/modals';
import { useToast } from '@/ui-kit/feedback';
import type { IDropdownOption } from '@/ui-kit/dropdown/types/searchableDropdownTypes';

/**
 * PsoPage component
 * 
 * Specialized user management page for PSOs with:
 * - Supervisor filter dropdown (multi-select) - filters data loaded in DataTable
 * - Transfer To dropdown (single-select)
 * - Batch transfer functionality with confirmation modal
 * - Checkboxes in main table for selection
 * 
 * Uses the same incremental pagination strategy as Admin/SuperAdmin pages.
 * Filter by supervisor is applied to the data already loaded in DataTable.
 */
export const PsoPage: React.FC = () => {
  const { showToast } = useToast();
  const config = createPsoPageConfig();

  // Standard user management hook (uses incremental pagination)
  const hook = useUserManagementPage<PsoItem>(config);

  // Supervisor filter hook (only used for options and state, filtering happens in onFetch)
  // Pass empty array since we filter in onFetch, not here
  const {
    filterSupervisorIds,
    setFilterSupervisorIds,
    filterOptions,
    transferOptions,
    loading: supervisorsLoading,
  } = useSupervisorFilter<PsoItem>([]);

  // Transfer hook (reuses useModalState internally)
  const {
    transferToEmail,
    setTransferToEmail,
    pendingTransfer,
    transferring,
    openTransferModal,
    closeTransferModal,
    executeTransfer,
  } = usePsoTransfer();

  // Selection state for main table (used for batch transfer)
  const [selectedMainKeys, setSelectedMainKeys] = useState<string[]>([]);
  
  // Refresh key for transfer operations (combined with hook.refreshKey)
  const [transferRefreshKey, setTransferRefreshKey] = useState<number>(0);
  
  // Combined refreshKey: use the maximum of hook.refreshKey and transferRefreshKey
  // This ensures both add/remove and transfer operations trigger a refresh
  const refreshKey = useMemo(() => Math.max(hook.refreshKey, transferRefreshKey), [hook.refreshKey, transferRefreshKey]);
  
  // Local filter function for supervisor filtering (applied to already loaded data)
  const supervisorFilter = useCallback(
    (data: PsoItem[]): PsoItem[] => {
      if (filterSupervisorIds.length === 0) {
        return data;
      }
      const allowSet = new Set(filterSupervisorIds);
      return data.filter((item: PsoItem) => item.supervisorAdId && allowSet.has(item.supervisorAdId));
    },
    [filterSupervisorIds]
  );

  // Handle transfer dropdown selection
  const handleTransferSelection = useCallback(
    (values: string[]): void => {
      if (values.length === 0) {
        setTransferToEmail(null);
        return;
      }
      
      // Single select: keep only last value
      const chosen = values.at(-1);
      if (chosen) {
        setTransferToEmail(chosen);
      }

      if (selectedMainKeys.length === 0) {
        showToast('Select at least one PSO to transfer', 'warning');
        return;
      }

      // Find supervisor name for confirmation
      const supervisor = transferOptions.find((opt: IDropdownOption<string>) => opt.value === chosen);
      if (!supervisor) {
        showToast('Supervisor not found', 'error');
        return;
      }

      // Open confirmation modal
      openTransferModal(chosen, supervisor.label, selectedMainKeys);
    },
    [selectedMainKeys, transferOptions, openTransferModal, showToast]
  );

  // Handle transfer confirmation
  const handleConfirmTransfer = useCallback(async (): Promise<void> => {
    await executeTransfer(selectedMainKeys, async () => {
      // Refresh total count and force DataTable remount to show updated supervisor info
      await hook.refreshItems();
      setTransferRefreshKey((prev) => prev + 1); // Force DataTable remount
      setSelectedMainKeys([]);
    });
  }, [selectedMainKeys, executeTransfer, hook]);

  // Custom left toolbar actions with filters
  const customLeftToolbarActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <AddButton label={config.ui.addButtonLabel} onClick={hook.handleOpenModal} />
        
        {/* Filter by Supervisor (multi-select) */}
        <SearchableDropdown<string>
          options={filterOptions}
          selectedValues={filterSupervisorIds}
          onSelectionChange={setFilterSupervisorIds}
          placeholder="Filter by Supervisor"
          className="flex-1"
          usePortal={true}
          closeOnSelect={false}
          isLoading={supervisorsLoading}
        />
        
        {/* Transfer To (single-select) */}
        <SearchableDropdown<string>
          options={transferOptions}
          selectedValues={transferToEmail ? [transferToEmail] : []}
          onSelectionChange={handleTransferSelection}
          placeholder="Transfer To"
          className="flex-1"
          usePortal={true}
        />
      </div>
    ),
    [
      config.ui.addButtonLabel,
      hook.handleOpenModal,
      filterOptions,
      filterSupervisorIds,
      setFilterSupervisorIds,
      transferOptions,
      transferToEmail,
      handleTransferSelection,
      supervisorsLoading,
    ]
  );


  // Handle row toggle for selection
  const handleToggleRow = useCallback((key: string, checked: boolean) => {
    if (checked) {
      setSelectedMainKeys((prev) => [...new Set([...prev, key])]);
    } else {
      setSelectedMainKeys((prev) => prev.filter((k) => k !== key));
    }
  }, []);

  // Handle toggle all for selection
  const handleToggleAll = useCallback((checked: boolean, keys: string[]) => {
    if (checked) {
      setSelectedMainKeys((prev) => Array.from(new Set([...prev, ...keys])));
    } else {
      setSelectedMainKeys((prev) => prev.filter((k) => !keys.includes(k)));
    }
  }, []);

  // Get row key for selection
  const getRowKey = useCallback((row: PsoItem, index: number) => {
    return row.email || row.id || `row-${index}`;
  }, []);

  // Selection config for PSO page (for batch transfer)
  // Note: We use email as key to ensure API receives emails, not IDs
  const psoSelection = useMemo(
    () => ({
      selectedKeys: selectedMainKeys,
      onToggleRow: handleToggleRow,
      onToggleAll: handleToggleAll,
      getRowKey,
    }),
    [selectedMainKeys, handleToggleRow, handleToggleAll, getRowKey]
  );

  return (
    <>
      <UserManagementPage<PsoItem>
        config={config}
        hook={hook}
        customLeftToolbarActions={customLeftToolbarActions}
        customSelection={psoSelection}
        externalLoading={transferring}
        customFilter={supervisorFilter}
        refreshKey={refreshKey}
      />

      {/* Transfer Confirmation Modal */}
      <ConfirmModal
        open={!!pendingTransfer}
        title="Confirm Transfer"
        message={
          pendingTransfer ? (
            <div className="text-center py-4">
              <p className="text-lg mb-4">
                Are you sure you want to transfer <strong>{pendingTransfer.psoCount}</strong> PSO(s) to:
              </p>
              <p className="text-xl font-semibold text-(--color-secondary) mb-4">
                {pendingTransfer.supervisorName}
              </p>
            </div>
          ) : (
            ''
          )
        }
        onConfirm={handleConfirmTransfer}
        onClose={closeTransferModal}
        confirmLabel="Confirm Transfer"
        confirmDisabled={transferring}
      />
    </>
  );
};
