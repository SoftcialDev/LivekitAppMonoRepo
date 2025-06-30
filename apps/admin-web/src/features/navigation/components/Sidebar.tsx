import React from 'react'
import { NavLink } from 'react-router-dom'
import IconWithLabel from '../../../components/IconWithLabel'
import camaraLogo from '@assets/InContact_logo.png'
import monitorIcon from '@assets/icon-monitor.png'
import UserItem from '../../auth/components/UserItem'
import type { UserStatus } from '../types/types'

interface SidebarProps {
  /** Everyone currently connected over WS */
  onlineUsers: UserStatus[]
  /** Everyone not connected over WS */
  offlineUsers: UserStatus[]
  /** Map from user.email → true if that user is actively streaming */
  streamingMap: Record<string, boolean>
  /** Called when the sidebar’s Play or Stop button is clicked */
  onToggle: (email: string, action: 'PLAY' | 'STOP') => void
}

const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  streamingMap,
  onToggle,
}) => {
  const linkBase = 'block py-2 pl-14 pr-3 rounded-md text-gray-300 transition-colors hover:text-[var(--color-secondary-hover)]'
  const activeLink = 'text-white font-semibold'

  // keep only first name + first surname
  const shortName = (u: UserStatus) => {
    const parts = (u.fullName ?? u.name ?? '').trim().split(/\s+/)
    return parts.slice(0, 2).join(' ')
  }

  return (
    <aside className="flex flex-col bg-[var(--color-primary)] text-white border-r border-black">
      {/* Header */}
      <div className="border-b border-black">
        <IconWithLabel
          src={camaraLogo}
          alt="In Contact"
          imgSize="h-4 sm:h-8"
          textSize="text-m sm:text-xl font-semibold"
          className="flex items-center px-6 py-4"
        >
          In Contact
        </IconWithLabel>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {/* Manage Section */}
        <div className="border-b border-black">
          <IconWithLabel
            src={monitorIcon}
            alt="Manage"
            imgSize="h-5 w-5"
            textSize="text-xs font-semibold"
            className="flex items-center px-6 py-4"
          >
            Manage
          </IconWithLabel>
          <NavLink to="/admins"      className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ''}`}>Admins</NavLink>
          <NavLink to="/supervisors" className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ''}`}>Supervisors</NavLink>
          <NavLink to="/psos"         className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ''}`}>PSOs</NavLink>
        </div>

        {/* Monitor Section */}
        <div className="border-b border-black">
          <IconWithLabel
            src={monitorIcon}
            alt="Monitor"
            imgSize="h-5 w-5"
            textSize="text-xs font-semibold"
            className="flex items-center px-6 py-4"
          >
            Monitor
          </IconWithLabel>
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ''}`}>PSOs streaming</NavLink>
        </div>

        {/* Presence Lists */}
        <div className="px-6 py-4">
          <div className="text-xs font-semibold mb-2">Online</div>
          {onlineUsers.map(orig => {
            const name = shortName(orig)
            return (
              <UserItem
                key={orig.email}
                user={{ ...orig, name, fullName: name }}
                isStreaming={!!streamingMap[orig.email]}
                onToggle={onToggle}
              />
            )
          })}

          <div className="text-xs font-semibold mt-4 mb-2">Offline</div>
          {offlineUsers.map(orig => {
            const name = shortName(orig)
            return (
              <UserItem
                key={orig.email}
                user={{ ...orig, name, fullName: name }}
                isStreaming={false}
                onToggle={onToggle}
              />
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
