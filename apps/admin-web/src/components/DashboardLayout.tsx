import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../features/navigation/components/Sidebar";
import Header from "./Header";
import { HeaderProvider } from "../context/HeaderContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { usePresenceStore } from "../stores/usePresenceStore";




/**
 * Application layout component.
 *
 * - Reads presence state (online/offline) from the global store
 *   instead of individual REST/WebSocket hooks.
 * - Handles Play/Stop commands using `cameraClient`.
 * - Renders a sticky `Header` and nested routes via `Outlet`.
 *
 * @component
 */
const Layout: React.FC = () => {
  const { account } = useAuth();
  const currentEmail = account?.username ?? "";

  // Store actions
  const loadSnapshot        = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket    = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);

  // Raw store state
  const rawOnlineUsers  = usePresenceStore(s => s.onlineUsers);
  const rawOfflineUsers = usePresenceStore(s => s.offlineUsers);

  // Filter out the current user
  const onlineUsers  = rawOnlineUsers .filter(u => u.email !== currentEmail);
  const offlineUsers = rawOfflineUsers.filter(u => u.email !== currentEmail);

  // Initial load
  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  // Real-time updates
  useEffect(() => {
    if (!currentEmail) return;
    connectWebSocket(currentEmail);
    return () => {
      disconnectWebSocket();
    };
  }, [currentEmail, connectWebSocket, disconnectWebSocket]);


  return (
    <HeaderProvider>
      <div className="grid grid-cols-[350px_1fr] min-h-screen">
        <Sidebar
          onlineUsers={onlineUsers}
          offlineUsers={offlineUsers}
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
