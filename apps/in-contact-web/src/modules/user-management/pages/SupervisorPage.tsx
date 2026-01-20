/**
 * @fileoverview Supervisor Page
 * @summary Page for managing Supervisors
 * @description Displays Supervisors list with add/remove functionality and Transfer PSOs feature
 */

import React, { useMemo, useCallback } from 'react';
import { useUserManagementPage, useSupervisorTransfer } from '../hooks';
import { UserManagementPage } from '../components';
import { createSupervisorPageConfig } from './config/supervisorPageConfig';
import { useUserInfo, UserRole } from '@/modules/auth';
import { AddButton } from '@/ui-kit/buttons';
import { ConfirmModal } from '@/ui-kit/modals';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import type { SupervisorItem } from './config/supervisorPageConfig';

/**
 * Supervisor management page
 *
 * Displays Supervisors with:
 * - Add/Remove functionality (SuperAdmin and Admin only, hidden for Supervisor role)
 * - Transfer PSOs button per row (Supervisor only)
 *
 * @returns JSX element with Supervisor management page
 */
export const SupervisorPage: React.FC = () => {
  const config = createSupervisorPageConfig();
  const hook = useUserManagementPage(config);
  const { userInfo } = useUserInfo();

  // Transfer hook for transferring all PSOs of current supervisor
  const {
    pendingTransfer,
    transferring,
    openTransferModal,
    closeTransferModal,
    executeTransfer,
  } = useSupervisorTransfer();

  // Hide Add button if user is Supervisor
  // Only show Add button if userInfo is loaded and user is not a Supervisor
  const customLeftToolbarActions = useMemo(() => {
    // If userInfo is not loaded yet, don't show the button (wait for role to be determined)
    if (!userInfo) {
      return null;
    }
    // If user is Supervisor, hide the Add button
    if (userInfo.role === UserRole.Supervisor) {
      return null;
    }
    // For SuperAdmin and Admin, show the Add button
    return <AddButton label={config.ui.addButtonLabel} onClick={hook.handleOpenModal} />;
  }, [userInfo, config.ui.addButtonLabel, hook.handleOpenModal]);

  // Handle transfer button click
  const handleTransfer = useCallback((row: SupervisorItem) => {
    const supervisorName = row.firstName && row.lastName
      ? `${row.firstName} ${row.lastName}`
      : row.email;
    openTransferModal(row.email, supervisorName);
  }, [openTransferModal]);

  // Handle transfer confirmation
  const handleConfirmTransfer = useCallback(async (): Promise<void> => {
    await executeTransfer(async () => {
      // Refresh total count and force DataTable remount
      await hook.refreshItems();
    });
  }, [executeTransfer, hook]);

  return (
    <>
      <UserManagementPage
        config={config}
        hook={hook}
        refreshKey={hook.refreshKey}
        customLeftToolbarActions={customLeftToolbarActions}
        externalLoading={transferring}
        handleTransfer={handleTransfer}
      />

      {/* Transfer Confirmation Modal */}
      <ConfirmModal
        open={!!pendingTransfer}
        title="Confirm Transfer"
        iconSrc={managementIcon}
        iconAlt="Transfer PSOs"
        message={
          pendingTransfer ? (
            <div className="text-center py-4">
              <p className="text-lg mb-4 text-white">
                Are you sure you want to transfer <strong>all your PSOs</strong> to:
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

