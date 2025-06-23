import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../features/navigation/components/Sidebar'
import { useAuth } from '../features/auth/hooks/useAuth'
import { usePresence } from '../features/navigation/hooks/usePresence'
import { HeaderProvider } from '../context/HeaderContext'
import Header from './Header'

/**
 * Application layout component.
 *
 * Renders a two-column grid:
 * - **Left column**: fixed-width sidebar (e.g. 350px) showing presence and controls.
 * - **Right column**: main area with a sticky header and flex-growing content area.
 *
 * Uses utility classes:
 * - `min-h-screen` on root to fill viewport.
 * - `flex flex-col min-h-0` on the right column to allow child pages to flex-grow without overflow.
 *
 * @returns The layout wrapper including sidebar and page content outlet.
 */
const Layout: React.FC = () => {
  const { account } = useAuth()
  const userEmail = account?.username ?? ''
  const { onlineUsers, offlineUsers } = usePresence(userEmail)

  /**
   * Handler to stop a user's session or stream.
   *
   * @param email - The email address of the user to stop.
   * @remarks
   * TODO: call AdminCommand API to issue stop command.
   */
  const handleStop = (email: string) => {
    // TODO: call AdminCommand API…
  }

  /**
   * Handler to enqueue a play command for a user.
   *
   * @param email - The email address of the user to play.
   * @remarks
   * TODO: enqueue pending command via backend.
   */
  const handlePlay = (email: string) => {
    // TODO: enqueue pending command…
  }

  return (
    <HeaderProvider>
      <div className="grid grid-cols-[350px_1fr] min-h-screen">
        {/* Sidebar fixed width */}
        <Sidebar
          onlineUsers={onlineUsers}
          offlineUsers={offlineUsers}
          onStop={handleStop}
          onPlay={handlePlay}
        />

        {/* Main area: flex column, min-h-0 so children flex-grow works */}
        <div className="flex flex-col min-h-0">
          {/* Sticky header */}
          <Header />

          {/* Page content: flex-1 so it fills remaining height */}
          <main className="flex-1 overflow-hidden bg-[var(--color-primary-dark)]">
            {/* Outlet renders the current page component */}
            <Outlet />
          </main>
        </div>
      </div>
    </HeaderProvider>
  )
}

export default Layout
