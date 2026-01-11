/**
 * @fileoverview SidebarLogo component
 * @summary Logo header for the sidebar
 * @description Renders the application logo at the top of the sidebar
 */

import React from 'react';
import camaraLogo from '@/shared/assets/InContact_logo.png';
import { IconWithLabel } from '@/ui-kit/layout';

/**
 * SidebarLogo component
 * 
 * Renders the application logo with "In Contact" text.
 * 
 * @returns JSX element with logo
 * 
 * @example
 * ```tsx
 * <SidebarLogo />
 * ```
 */
export const SidebarLogo: React.FC = () => {
  return (
    <div className="border-b border-black px-6 py-4">
      <IconWithLabel
        src={camaraLogo}
        alt="In Contact"
        imgSize="h-4 sm:h-8"
        textSize="text-m sm:text-xl font-semibold"
        className="flex items-center"
      >
        In Contact
      </IconWithLabel>
    </div>
  );
};

