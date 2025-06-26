import React from 'react';
import { NavLink } from 'react-router-dom';
import IconWithLabel from '../../../components/IconWithLabel';
import camaraLogo from '@assets/InContact_logo.png';
import monitorIcon from '@assets/icon-monitor.png';
import OnlineUserItem from '../../../features/auth/components/OnlineUserItem';
import OfflineUserItem from '../../../features/auth/components/OfflineUserItem';
import type { UserStatus } from '../types/types';

/**
 * SidebarProps
 *
 * @property onlineUsers  Array of users currently online.
 * @property offlineUsers Array of users currently offline.
 * @property onStop       Callback when stopping an online user's video.
 * @property onPlay       Callback when starting an offline user's video.
 */
interface SidebarProps {
  onlineUsers:  UserStatus[];
  offlineUsers: UserStatus[];
  onStop:       (email: string) => void;
  onPlay:       (email: string) => void;
}

/**
 * Sidebar
 *
 * Renders the application sidebar with:
 * 1. Header (logo + title).
 * 2. "Manage" links (Admins, Supervisors, PSOs).
 * 3. "Monitor" link (PSO dashboard).
 * 4. Real-time lists of online and offline users.
 *
 * Uses `NavLink` to highlight the active route.
 */
const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  onStop,
  onPlay,
}) => {
  const linkBase   =
    'block py-2 pl-14 pr-3 rounded-md text-gray-300 transition-colors hover:text-[var(--color-secondary-hover)]';
  const activeLink = 'text-white font-semibold';

  return (
    <aside className="flex flex-col bg-[var(--color-primary)] text-white border-r border-black">
      {/* Header */}
      <div className="border-b border-black">
        <IconWithLabel
          src={camaraLogo}
          alt="In Contact"
          imgSize="h-4 sm:h-8 md:h-8"
          textSize="text-m sm:text-xl md:text-xl font-semibold"
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

          <NavLink
            to="/admins"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ''}`
            }
          >
            Admins
          </NavLink>

          <NavLink
            to="/supervisors"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ''}`
            }
          >
            Supervisors
          </NavLink>

          <NavLink
            to="/psos"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ''}`
            }
          >
            PSOs
          </NavLink>
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

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ''}`
            }
          >
            PSOs
          </NavLink>
        </div>

        {/* Presence Lists */}
        <div className="px-6 py-4">
          <div className="text-xs font-semibold mb-2">Online</div>
          {onlineUsers.map(u => (
            <OnlineUserItem key={u.email} user={u} onStop={onStop} />
          ))}

          <div className="text-xs font-semibold mt-4 mb-2">Offline</div>
          {offlineUsers.map(u => (
            <OfflineUserItem key={u.email} user={u} onPlay={onPlay} />
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
