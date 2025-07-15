import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../features/navigation/components/Sidebar";
import SidebarToggle from "../features/navigation/components/SidebarToggle";
import Header from "../components/Header";
import { HeaderProvider } from "../context/HeaderContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { usePresenceStore } from "../stores/usePresenceStore";

interface LayoutProps {}

/**
 * Application layout component.
 *
 * - Loads an initial presence snapshot, then opens a WebSocket for live updates.
 * - Filters out the current user from the sidebar lists.
 * - Wraps everything in a HeaderProvider and renders a sticky Header plus nested routes via Outlet.
 * - Manages sidebar collapse/expand by toggling the grid column width.
 * - Renders a toggle button *outside* the sidebar column so it remains visible and clickable at all times.
 *
 * @component
 * @returns {JSX.Element} The layout of the application.
 */
const Layout: React.FC<LayoutProps> = (): JSX.Element => {
  const { account } = useAuth();
  const currentEmail = account?.username ?? "";

  /** Whether the sidebar is collapsed. */
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Presence store actions
  const loadSnapshot        = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket    = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);

  // Presence store state
  const rawOnlineUsers  = usePresenceStore(s => s.onlineUsers);
  const rawOfflineUsers = usePresenceStore(s => s.offlineUsers);

  // Exclude the current user from the lists
  const onlineUsers  = rawOnlineUsers.filter(u => u.email !== currentEmail);
  const offlineUsers = rawOfflineUsers.filter(u => u.email !== currentEmail);

  /**
   * On mount (or when currentEmail changes):
   * 1. Load a one-time presence snapshot.
   * 2. Connect to WebSocket for real-time updates.
   * 3. Disconnect on unmount or when currentEmail changes.
   */
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
      <div
        className={`
          grid min-h-screen
          transition-all duration-300 ease-in-out
          ${isCollapsed
            ? "grid-cols-[0px_1fr]"   /* sidebar hidden */
            : "grid-cols-[350px_1fr]"} /* sidebar visible */
        `}
      >
        {/* Sidebar column */}
        <Sidebar
          onlineUsers={onlineUsers}
          offlineUsers={offlineUsers}
          loading={false}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(c => !c)}
        />

        {/* Main content column */}
        <div className="relative flex flex-col min-h-0">
          <Header />

          {/*
            Sidebar toggle sits *outside* the sidebar, in the content column.
            It uses -translate-x-full so only its right half peeks in when collapsed,
            and it remains clickable at all times.
          */}
          <div
            className="
              absolute left-0 top-1/2 z-20
              transform  -translate-y-1/2
            "
          >
            <SidebarToggle
              isCollapsed={isCollapsed}
              onToggle={() => setIsCollapsed(c => !c)}
            />
          </div>

          <main className="flex-1 overflow-hidden bg-[var(--color-primary-dark)]">
            <Outlet />
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
};

export default Layout;
