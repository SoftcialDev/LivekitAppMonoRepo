/**
 * @fileoverview Supervisor Page
 * @summary Page for managing Supervisors
 * @description Displays Supervisors list with add/remove functionality and Transfer PSOs feature
 */

import React from 'react';
import { useUserManagementPage } from '../hooks';
import { UserManagementPage } from '../components';
import { createSupervisorPageConfig } from './config/supervisorPageConfig';

/**
 * Supervisor management page
 *
 * Displays Supervisors with:
 * - Add/Remove functionality (Admin only)
 * - Transfer PSOs button per row (Supervisor only)
 *
 * @returns JSX element with Supervisor management page
 */
export const SupervisorPage: React.FC = () => {
  const config = createSupervisorPageConfig();
  const hook = useUserManagementPage(config);

  return <UserManagementPage config={config} hook={hook} refreshKey={hook.refreshKey} />;
};

