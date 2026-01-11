/**
 * @fileoverview SidebarDashboardSection component
 * @summary Navigation section for dashboard/streaming routes
 * @description Renders navigation link for PSOs streaming dashboard
 */

import React from 'react';
import { IconWithLabel } from '@/ui-kit/layout';
import monitorIcon from '@/shared/assets/icon-monitor.png';
import type { ISidebarDashboardSectionProps } from './types/sidebarComponentsTypes';

/**
 * SidebarDashboardSection component
 * 
 * Renders the "PSOs Streaming" section with navigation link to the dashboard.
 * 
 * @param props - Component props
 * @returns JSX element with dashboard section
 */
export const SidebarDashboardSection: React.FC<ISidebarDashboardSectionProps> = ({
  renderNavLink,
}) => {
  return (
    <div className="border-b border-black">
      <IconWithLabel
        src={monitorIcon}
        alt="Monitor"
        imgSize="h-5 w-5"
        textSize="text-xs font-semibold"
        className="flex items-center px-6 py-4"
      >
        PSOs Streaming
      </IconWithLabel>

      {renderNavLink('/psos-streaming', 'PSOs Streaming')}
    </div>
  );
};

