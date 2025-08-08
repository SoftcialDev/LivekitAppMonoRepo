import { HeaderProvider } from "@/app/providers/HeaderContext";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { usePresenceStore } from "../presence/usePresenceStore";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {}

/**
 * Application layout component.
 *
 * @remarks
 * This component defines the main structural layout for the application.
 * It includes:
 * - A sidebar displaying online/offline users (excluding the current user).
 * - A header displayed across all routes.
 * - A dynamic main content area rendered via `Outlet` from React Router.
 *
 * @description
 * On mount, the component:
 * 1. Retrieves the initial presence snapshot from the presence store.
 * 2. Connects to a WebSocket for live presence updates.
 * 3. Disconnects from the WebSocket on unmount or when the current user changes.
 *
 * It also manages a local collapsed state for the sidebar.
 *
 * @component
 */
const Layout: React.FC<LayoutProps> = () => {
  const { account } = useAuth();
  const currentEmail = account?.username ?? "";

  // Local state for sidebar collapse
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * Toggles the collapsed state of the sidebar.
   */
  const handleToggleCollapse = () => setIsCollapsed(prev => !prev);

  // Presence store actions
  const loadSnapshot = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);

  // Presence store state
  const rawOnlineUsers = usePresenceStore(s => s.onlineUsers);
  const rawOfflineUsers = usePresenceStore(s => s.offlineUsers);

  // Exclude self from sidebar
  const onlineUsers = rawOnlineUsers.filter(u => u.email !== currentEmail);
  const offlineUsers = rawOfflineUsers.filter(u => u.email !== currentEmail);

  useEffect(() => {
    if (!currentEmail) return;
    loadSnapshot();
    connectWebSocket(currentEmail);
    return () => {
      disconnectWebSocket();
    };
  }, [currentEmail, loadSnapshot, connectWebSocket, disconnectWebSocket]);

  return (
    <HeaderProvider>
      <div className="grid grid-cols-[350px_1fr] min-h-screen">
        <Sidebar
          onlineUsers={onlineUsers}
          offlineUsers={offlineUsers}
          loading={false}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <div className="flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-hidden bg-[var(--color-primary-dark)]">
            <Outlet />
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
};

export default Layout;
