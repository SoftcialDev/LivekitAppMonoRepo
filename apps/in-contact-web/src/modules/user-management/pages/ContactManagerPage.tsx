/**
 * @fileoverview Contact Manager Page
 * @summary Page for managing Contact Managers
 * @description Displays Contact Managers list with add/remove functionality
 */

import React from 'react';
import { useUserManagementPage } from '../hooks';
import { UserManagementPage } from '../components';
import { createContactManagerPageConfig } from './config/contactManagerPageConfig';

/**
 * Contact Manager management page
 *
 * Displays Contact Managers with:
 * - Add/Remove functionality
 * - Status field
 * - FullName to firstName/lastName mapping
 *
 * @returns JSX element with Contact Manager management page
 */
export const ContactManagerPage: React.FC = () => {
  const config = createContactManagerPageConfig();
  const hook = useUserManagementPage(config);

  return <UserManagementPage config={config} hook={hook} refreshKey={hook.refreshKey} />;
};

