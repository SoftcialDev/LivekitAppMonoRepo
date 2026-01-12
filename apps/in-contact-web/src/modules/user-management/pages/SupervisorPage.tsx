/**
 * @fileoverview Supervisor Page
 * @summary Page for managing Supervisors
 * @description Displays Supervisors list with add/remove functionality and Transfer PSOs feature
 */

import React, { useMemo } from 'react';
import { useUserManagementPage } from '../hooks';
import { UserManagementPage } from '../components';
import { createSupervisorPageConfig } from './config/supervisorPageConfig';
import { useUserInfo, UserRole } from '@/modules/auth';
import { AddButton } from '@/ui-kit/buttons';

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

  return (
    <UserManagementPage
      config={config}
      hook={hook}
      refreshKey={hook.refreshKey}
      customLeftToolbarActions={customLeftToolbarActions}
    />
  );
};

