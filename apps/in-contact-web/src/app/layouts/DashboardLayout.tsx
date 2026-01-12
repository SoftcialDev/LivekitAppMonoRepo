/**
 * @fileoverview DashboardLayout - Main application layout component
 * @summary Layout with sidebar, header and main content area
 * @description Defines the main structural layout for the application.
 * Includes a sidebar with user presence, header displayed across all routes,
 * and a dynamic main content area.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/ui-kit/layout';
import { Sidebar, SidebarToggle, useSidebar } from '@/modules/sidebar';
import { usePresence } from '@/modules/presence';

/**
 * DashboardLayout component
 * 
 * Main structural layout for the application. It includes:
 * - A sidebar with user presence, search, and navigation (based on role)
 * - A toggle button for collapsing/expanding the sidebar (always visible)
 * - A header displayed across all routes
 * - A dynamic main content area rendered via `Outlet` from React Router
 * 
 * @returns JSX element with sidebar, toggle, header and content area
 */
export const DashboardLayout: React.FC = () => {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { onlineUsers, offlineUsers } = usePresence();

  return (
    <div className="flex min-h-screen relative">
      <Sidebar
        onlineUsers={onlineUsers}
        offlineUsers={offlineUsers}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <main className="flex-1 flex flex-col">
        <Header />
        <Outlet />
      </main>
      <div className={`absolute top-1/2 transform -translate-y-1/2 z-50 ${isCollapsed ? 'left-0' : 'left-[350px]'} transition-all duration-300`}>
        <SidebarToggle isCollapsed={isCollapsed} onToggle={toggleCollapse} />
      </div>
    </div>
  );
};

