/**
 * @fileoverview AdminPage - Admin user management page
 * @summary Page for managing Admin users
 * @description Displays and manages Admin users with add/remove functionality
 */

import React from 'react';
import { useUserManagementPage } from '../hooks';
import { UserManagementPage } from '../components/UserManagementPage';
import { createAdminPageConfig } from './config/adminPageConfig';

/**
 * AdminPage component
 *
 * Displays a table of Admin users with the ability to:
 * - Add new Admins from Supervisor, PSO, or Unassigned users
 * - Remove existing Admins (except yourself)
 *
 * @returns JSX element with Admin management page
 */
export const AdminPage: React.FC = () => {
  const config = createAdminPageConfig();
  const hook = useUserManagementPage(config);

  return <UserManagementPage config={config} hook={hook} refreshKey={hook.refreshKey} />;
};

