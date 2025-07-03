import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../features/navigation/components/Sidebar";
import Header from "./Header";
import { HeaderProvider } from "../context/HeaderContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { usePresenceStore } from "../stores/usePresenceStore";

interface LayoutProps {}

/**
 * Application layout component.
 *
 * - Loads an initial presence snapshot and then
 *   opens a single WebSocket connection for live updates.
 * - Filters out the current user from the sidebar lists.
 * - Wraps everything in a HeaderProvider and renders
 *   a sticky Header plus nested routes via Outlet.
 *
 * @component
 */
const Layout: React.FC<LayoutProps> = () => {
  const { account } = useAuth();
  const currentEmail = account?.username ?? "";

  // Presence store actions
  const loadSnapshot        = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket    = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);

  // Presence store state
  const rawOnlineUsers  = usePresenceStore(s => s.onlineUsers);
  const rawOfflineUsers = usePresenceStore(s => s.offlineUsers);

  // Exclude self from sidebar
  const onlineUsers  = rawOnlineUsers .filter(u => u.email !== currentEmail);
  const offlineUsers = rawOfflineUsers.filter(u => u.email !== currentEmail);

  /**
   * On mount or when currentEmail changes:
   * 1. Load a one-time presence snapshot.
   * 2. Connect to WebSocket for real-time updates.
   * 3. Disconnect when unmounting or email changes.
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
      <div className="grid grid-cols-[350px_1fr] min-h-screen">
        <Sidebar
          onlineUsers={onlineUsers}
          offlineUsers={offlineUsers} loading={false}        />
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
