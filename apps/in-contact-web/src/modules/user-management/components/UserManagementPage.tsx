/**
 * @fileoverview UserManagementPage component
 * @summary Generic user management page component
 * @description Reusable component for Admin, SuperAdmin, Supervisor, PSO, and ContactManager pages
 */

import React, { useMemo, useCallback, useState } from 'react';
import { DataTable, type Column } from '@/ui-kit/tables';
import { TableComponent } from '@/ui-kit/tables';
import { FormModal } from '@/ui-kit/modals';
import { AddButton, TrashButton } from '@/ui-kit/buttons';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { useHeader } from '@/app/stores';
import { useAuth } from '@/modules/auth';
import type {
  BaseUserManagementItem,
  CandidateUser,
  IUserManagementPageProps,
} from '../types';

/**
 * Generic UserManagementPage component
 *
 * Displays a table of users with add/remove functionality.
 * Uses DataTable for the main table and FormModal for the add dialog.
 *
 * @template T - Type of items being managed
 * @param props - Component props
 * @returns JSX element with user management page
 */
export function UserManagementPage<T extends BaseUserManagementItem>({
  config,
  hook,
  customLeftToolbarActions,
  customSelection,
  externalLoading,
  refreshKey,
  customFilter,
}: Readonly<IUserManagementPageProps<T>>): JSX.Element {
  const { account } = useAuth();
  const currentEmail = account?.username?.toLowerCase() ?? '';
  const [selectedMainKeys, setSelectedMainKeys] = useState<string[]>([]);

  const {
    totalCount,
    onFetch,
    itemsLoading,
    candidates,
    candidatesLoading,
    isModalOpen,
    selectedEmails,
    handleOpenModal,
    handleCloseModal,
    handleConfirmAdd,
    handleRemove,
    isRemoving,
    setSelectedEmails,
  } = hook;


  // Set page header
  useHeader({
    title: config.ui.title,
    iconSrc: managementIcon,
    iconAlt: config.ui.title,
  });

  // Add actions column to main columns with remove button
  const mainColumnsWithActions = useMemo<Column<T>[]>(() => {
    const actionsColumn: Column<T> = {
      header: 'Actions',
      key: 'email',
      render: (row) => {
        const itemEmail = row.email?.toLowerCase() ?? '';
        const currentUserEmail = currentEmail.toLowerCase();
        
        // Don't show delete for current user
        if (itemEmail === currentUserEmail) {
          return null;
        }

        // Check minimum items requirement (using totalCount from API)
        const minItems = config.features?.minItemsForDeletion ?? 0;
        // If totalCount is undefined, show button (will be checked again after load)
        // If totalCount is defined, check against minItems
        if (totalCount !== undefined && totalCount <= minItems) {
          return null;
        }

        return (
          <TrashButton
            onClick={() => handleRemove(row)}
            title="Remove user"
          />
        );
      },
    };

    return [...config.columns.mainColumns, actionsColumn];
  }, [config.columns.mainColumns, config.features, totalCount, handleRemove, currentEmail]);

  // Candidate columns (no checkbox column, using TableComponent selection instead)
  const candidateColumns = useMemo<Column<CandidateUser>[]>(() => {
    return config.columns.candidateColumns;
  }, [config.columns.candidateColumns]);

  // Helper function to get row key (consistent across all uses)
  const getCandidateRowKey = useCallback((candidate: CandidateUser, idx: number): string => {
    return candidate.id || candidate.email || `candidate-${idx}`;
  }, []);

  // Helper function to find candidate by key
  const findCandidateByKey = useCallback((key: string): CandidateUser | undefined => {
    for (let idx = 0; idx < candidates.length; idx++) {
      const c = candidates[idx];
      const candidateKey = getCandidateRowKey(c, idx);
      if (candidateKey === key) {
        return c;
      }
    }
    return undefined;
  }, [candidates, getCandidateRowKey]);

  // Helper function to get visible emails from keys
  const getVisibleEmailsFromKeys = useCallback((keys: string[]): string[] => {
    const visibleEmails: string[] = [];
    for (let idx = 0; idx < candidates.length; idx++) {
      const c = candidates[idx];
      const candidateKey = getCandidateRowKey(c, idx);
      if (keys.includes(candidateKey)) {
        visibleEmails.push(c.email);
      }
    }
    return visibleEmails;
  }, [candidates, getCandidateRowKey]);

  // Handler for toggling a single candidate row
  const handleCandidateToggleRow = useCallback((key: string, checked: boolean) => {
    const candidate = findCandidateByKey(key);
    if (!candidate) return;

    const selectAction = () => setSelectedEmails([...selectedEmails, candidate.email]);
    const deselectAction = () => setSelectedEmails(selectedEmails.filter((email) => email !== candidate.email));
    const actions = [deselectAction, selectAction];
    actions[Number(checked)]();
  }, [findCandidateByKey, selectedEmails, setSelectedEmails]);

  // Handler for toggling all visible candidates
  const handleCandidateToggleAll = useCallback((checked: boolean, keys: string[]) => {
    const visibleEmails = getVisibleEmailsFromKeys(keys);
    const selectAction = () => setSelectedEmails([...new Set([...selectedEmails, ...visibleEmails])]);
    const deselectAction = () => setSelectedEmails(selectedEmails.filter((email) => !visibleEmails.includes(email)));
    const actions = [deselectAction, selectAction];
    actions[Number(checked)]();
  }, [getVisibleEmailsFromKeys, selectedEmails, setSelectedEmails]);

  // Selection config for candidates table (enables header checkbox)
  const candidateSelection = useMemo(
    () => {
      // Calculate selectedKeys based on selectedEmails
      const selectedKeys = candidates
        .filter((c) => selectedEmails.includes(c.email))
        .map((c, idx) => getCandidateRowKey(c, idx));

      return {
        selectedKeys,
        onToggleRow: handleCandidateToggleRow,
        onToggleAll: handleCandidateToggleAll,
        getRowKey: (row: CandidateUser, idx: number) => getCandidateRowKey(row, idx),
      };
    },
    [candidates, selectedEmails, getCandidateRowKey, handleCandidateToggleRow, handleCandidateToggleAll]
  );

  // Create data loader for incremental pagination
  const mainDataLoader = useMemo(
    () => ({
      initialFetchSize: 200, // Initial load: 200 records
      fetchSize: 200, // Each incremental fetch: 200 records
      // Pass totalCount as-is (can be undefined, 0, or > 0)
      // undefined = not loaded yet (externalLoading will show loading, DataTable will wait)
      // 0 = loaded and no items (DataTable will fetch once if externalLoading is true, then show "no results")
      // > 0 = has items (DataTable will fetch normally)
      totalCount: totalCount,
      onFetch: async (limit: number, offset: number) => {
        // Call the real API fetch function
        const items = await onFetch(limit, offset);
        return {
          data: items,
          total: totalCount || items.length, // Fallback to items.length if totalCount not loaded yet
          count: items.length,
        };
      },
    }),
    [totalCount, onFetch]
  );

  // Helper function to get main row key
  const getMainRowKey = useCallback((item: T, idx: number): string => {
    return item.id || item.email || `row-${idx}`;
  }, []);

  // Selection config for main table (enabled for future batch operations)
  const handleToggleRow = useCallback((key: string) => {
    setSelectedMainKeys(prev => [...prev, key]);
  }, []);

  const handleUntoggleRow = useCallback((key: string) => {
    setSelectedMainKeys(prev => prev.filter((k) => k !== key));
  }, []);

  const handleToggleAll = useCallback((keys: string[]) => {
    setSelectedMainKeys(prev => [...new Set([...prev, ...keys])]);
  }, []);

  const handleUntoggleAll = useCallback((keys: string[]) => {
    setSelectedMainKeys(prev => prev.filter((k) => !keys.includes(k)));
  }, []);

  const mainSelection = useMemo(
    () => ({
      selectedKeys: selectedMainKeys,
      onToggleRow: (key: string, checked: boolean) => {
        const selectAction = () => handleToggleRow(key);
        const deselectAction = () => handleUntoggleRow(key);
        const actions = [deselectAction, selectAction];
        actions[Number(checked)]();
      },
      onToggleAll: (checked: boolean, keys: string[]) => {
        const selectAction = () => handleToggleAll(keys);
        const deselectAction = () => handleUntoggleAll(keys);
        const actions = [deselectAction, selectAction];
        actions[Number(checked)]();
      },
      getRowKey: (row: T, index: number) => getMainRowKey(row, index),
    }),
    [selectedMainKeys, handleToggleRow, handleUntoggleRow, handleToggleAll, handleUntoggleAll, getMainRowKey]
  );


  return (
    <div className="relative flex flex-col flex-1 min-h-0 bg-(--color-primary-dark)">
      {/* Main table */}
      <div className="flex justify-center w-full flex-1">
        <div className="max-w-[90%] w-full mx-auto">
          <DataTable<T>
            key={refreshKey} // Force remount only when refreshKey is explicitly provided (e.g., after transfer)
            columns={mainColumnsWithActions}
            dataLoader={mainDataLoader}
            selection={customSelection ?? mainSelection}
            pageSize={10}
            leftToolbarActions={
              customLeftToolbarActions === null
                ? null
                : customLeftToolbarActions ?? (
                    <AddButton label={config.ui.addButtonLabel} onClick={handleOpenModal} />
                  )
            }
            externalLoading={externalLoading || itemsLoading || isRemoving}
            externalLoadingAction={(() => {
              if (externalLoading) return 'Transferring PSOs...';
              if (isRemoving) return 'Deleting user...';
              if (totalCount === undefined) return 'Loading...';
              return config.ui.loadingAction;
            })()}
            customFilter={customFilter}
          />
        </div>
      </div>

      {/* Add modal */}
      <FormModal
        open={isModalOpen}
        title={config.ui.modalTitle}
        iconSrc={managementIcon}
        iconAlt={config.ui.title}
        onClose={handleCloseModal}
        onSubmit={handleConfirmAdd}
        submitLabel={config.ui.confirmLabel}
        loading={itemsLoading || candidatesLoading}
        loadingAction={
          itemsLoading ? config.ui.loadingAction : config.ui.candidatesLoadingAction
        }
        submitDisabled={selectedEmails.length === 0}
        maxWidth="w-[90%]"
      >
        {/* Table with local pagination and search with selection */}
        <div className="flex flex-col flex-1 min-h-0">
          <TableComponent<CandidateUser>
            columns={candidateColumns}
            data={candidates}
            loading={candidatesLoading}
            loadingAction={config.ui.candidatesLoadingAction}
            headerBg="bg-[var(--color-primary)]"
            tablePadding="px-0 py-0"
            enableLocalPagination={true}
            pageSize={7}
            enableLocalSearch={true}
            searchPlaceholder="Search candidates..."
            selection={candidateSelection}
          />
        </div>
      </FormModal>
    </div>
  );
}

