
import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../features/navigation/components/Sidebar";
import Header from "./Header";
import { HeaderProvider } from "../context/HeaderContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { usePresence } from "../features/navigation/hooks/usePresence";
import { usePresenceWebSocket } from "../features/navigation/hooks/usePresenceWebSocket";
import { CameraCommandClient } from "../services/camaraCommandClient";
import type { UserStatus } from "../features/navigation/types/types";

const cameraClient = new CameraCommandClient();

/**
 * Application layout component.
 *
 * - Owns presence state: populates `onlineUsers` and `offlineUsers` via
 *   REST snapshot (`usePresence`) and updates them via WebSocket diffs
 *   (`usePresenceWebSocket`).
 * - Passes presence lists and `streamingMap` into the `Sidebar`.
 * - Handles Play/Stop commands using `cameraClient`.
 * - Renders a sticky `Header` and nested routes via `Outlet`.
 *
 * @component
 * @returns The layout wrapper for all pages, including sidebar and header.
 */
const Layout: React.FC = () => {
  // Logged-in user’s email for joining PubSub group
  const { account } = useAuth();
  const currentEmail = account?.username ?? "";

  // Presence lists
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<UserStatus[]>([]);

  // Initial REST snapshot; populates presence lists once
  const { streamingMap } = usePresence({
    onLoaded(online, offline) {
      setOnlineUsers(online);
      setOfflineUsers(offline);
    },
  });

  // Live updates via WebSocket
  const handlePresencePush = useCallback(
    (u: UserStatus, status: "online" | "offline") => {
      if (status === "online") {
        setOnlineUsers((prev) =>
          prev.some((x) => x.email === u.email) ? prev : [...prev, u]
        );
        setOfflineUsers((prev) => prev.filter((x) => x.email !== u.email));
      } else {
        setOfflineUsers((prev) =>
          prev.some((x) => x.email === u.email) ? prev : [...prev, u]
        );
        setOnlineUsers((prev) => prev.filter((x) => x.email !== u.email));
      }
    },
    []
  );
  usePresenceWebSocket({ currentEmail, onPresence: handlePresencePush });


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
