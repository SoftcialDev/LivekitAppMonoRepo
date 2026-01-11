/**
 * @fileoverview SidebarManageSection component
 * @summary Navigation section for management routes
 * @description Renders navigation links for user management, reports, and admin functions
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconWithLabel } from '@/ui-kit/layout';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import type { ISidebarManageSectionProps } from './types/sidebarComponentsTypes';
import { SIDEBAR_LINK_CLASSES, SPECIAL_ACCESS_EMAILS } from '../constants/sidebarConstants';

/**
 * SidebarManageSection component
 * 
 * Renders the "Manage" section with navigation links for:
 * - User management (Super Admins, Admins, Supervisors, PSOs, Contact Managers)
 * - Reports (Snapshots, Recording, Talk Sessions)
 * - Special routes (Error Logs, Camera Failures) based on email access
 * 
 * @param props - Component props
 * @returns JSX element with manage section
 */
export const SidebarManageSection: React.FC<ISidebarManageSectionProps> = ({
  isSuperAdmin,
  isAdmin,
  isSupervisor,
  currentEmail,
  renderNavLink,
}) => {
  const emailLower = currentEmail.toLowerCase();
  const hasErrorLogsAccess = emailLower.includes(SPECIAL_ACCESS_EMAILS.ERROR_LOGS);
  const hasCameraFailuresAccess = emailLower.includes(SPECIAL_ACCESS_EMAILS.CAMERA_FAILURES);

  return (
    <div className="border-b border-black">
      <IconWithLabel
        src={managementIcon}
        alt="Manage"
        imgSize="h-5 w-5"
        textSize="text-xs font-semibold"
        className="flex items-center px-6 py-4"
      >
        Manage
      </IconWithLabel>

      {isSuperAdmin && renderNavLink('/superAdmins', 'Super Admins')}

      {(isAdmin || isSuperAdmin) && renderNavLink('/admins', 'Admins')}

      {(isAdmin || isSuperAdmin) && renderNavLink('/snapshotReport', 'Snapshots Report')}

      {(isAdmin || isSuperAdmin) && renderNavLink('/recordings', 'Recordings')}

      {(isAdmin || isSuperAdmin) && renderNavLink('/talkSessions', 'Talk Sessions')}

      {isSuperAdmin && renderNavLink('/contactManagers', 'Contact Managers')}

      {(isAdmin || isSupervisor || isSuperAdmin) && renderNavLink('/supervisors', 'Supervisors')}

      {(isAdmin || isSupervisor || isSuperAdmin) && renderNavLink('/psos', 'PSOs')}

      {/* Error Logs - Only visible for users with email containing "shanty.cerdas" */}
      {hasErrorLogsAccess && (
        <NavLink
          to="/errorLogs"
          className={({ isActive }) =>
            `${SIDEBAR_LINK_CLASSES.BASE} ${isActive ? SIDEBAR_LINK_CLASSES.ACTIVE : ''}`
          }
        >
          Error Logs
        </NavLink>
      )}

      {/* Camera Failures - Only visible for users with email containing "shanty.cerdas" */}
      {hasCameraFailuresAccess && renderNavLink('/cameraFailures', 'Camera Failures')}
    </div>
  );
};

