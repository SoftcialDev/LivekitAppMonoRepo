// src/layout/Layout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../features/navigation/components/Sidebar';
import { useAuth } from '../features/auth/hooks/useAuth';
import { usePresence } from '../features/navigation/hooks/usePresence';
import { HeaderProvider } from '../context/HeaderContext';
import Header from './Header';
import { CameraCommandClient } from '../services/camaraCommandClient';

const cameraClient = new CameraCommandClient();

/**
 * Application layout.
 * - Sidebar shows online/offline users + Play/Stop buttons.
 * - Main area renders pages under a sticky header.
 */
const Layout: React.FC = () => {
  const { account } = useAuth();
  const userEmail = account?.username ?? '';

  // presence hook now returns streamingMap[email] = true if actively streaming
 const { onlineUsers, offlineUsers, streamingMap } = usePresence()

  /**
   * When an admin clicks "Play" or "Stop" in the sidebar.
   */
  const handleToggle = async (
    employeeEmail: string,
    action: 'PLAY' | 'STOP'
  ) => {
    try {
      if (action === 'PLAY') {
        await cameraClient.start(employeeEmail);
      } else {
        await cameraClient.stop(employeeEmail);
      }
    } catch (err) {
      console.error('Failed to send camera command', err);
      // TODO: show user feedback
    }
  };

  return (
    <HeaderProvider>
      <div className="grid grid-cols-[350px_1fr] min-h-screen">
        <Sidebar
          onlineUsers={onlineUsers}
          offlineUsers={offlineUsers}
          streamingMap={streamingMap}
          onToggle={handleToggle}
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
