/**
 * @fileoverview SuperAdminPage - Super Admin user management page
 * @summary Page for managing Super Admin users
 * @description Displays and manages Super Admin users with add/remove functionality
 */

import React from 'react';
import { useUserManagementPage } from '../hooks';
import { UserManagementPage } from '../components/UserManagementPage';
import { createSuperAdminPageConfig } from './config/superAdminPageConfig';

/**
 * SuperAdminPage component
 *
 * Displays a table of Super Admin users with the ability to:
 * - Add new Super Admins from any user role (Admin, Supervisor, PSO, Unassigned)
 * - Remove existing Super Admins (except yourself and minimum of 1 must remain)
 *
 * @returns JSX element with Super Admin management page
 */
export const SuperAdminPage: React.FC = () => {
  const config = createSuperAdminPageConfig();
  const hook = useUserManagementPage(config);

  return <UserManagementPage config={config} hook={hook} refreshKey={hook.refreshKey} />;
};

