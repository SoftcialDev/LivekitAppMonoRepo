
import React from 'react';
import { NavLink } from 'react-router-dom';
import IconWithLabel from '../../../components/IconWithLabel';
import camaraLogo from '@assets/InContact_logo.png';
import monitorIcon from '@assets/icon-monitor.png';
import OnlineUserItem from '../../../features/auth/components/OnlineUserItem';
import OfflineUserItem from '../../../features/auth/components/OfflineUserItem';
import type { UserStatus } from '../types/types';

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  /** Array of users currently online (may be empty). */
  onlineUsers: UserStatus[];
  /** Array of users currently offline (may be empty). */
  offlineUsers: UserStatus[];
  /**
   * Handler invoked when stopping an online user's video.
   * @param email The user's email address.
   */
  onStop: (email: string) => void;
  /**
   * Handler invoked when starting an offline user's video.
   * @param email The user's email address.
   */
  onPlay: (email: string) => void;
}

/**
 * Sidebar component.
 *
 * Renders:
 * 1. App header with logo + title.
 * 2. "Manage" section with links to Admins, Supervisors, and PSOs (list page).
 * 3. "Monitor" section with a link to the PSO dashboard.
 * 4. Lists of online and offline users.
 *
 * The active NavLink is styled with white text and semi-bold font.
 *
 * @param onlineUsers   Array of users currently online.
 * @param offlineUsers  Array of users currently offline.
 * @param onStop        Handler to stop an online user's video.
 * @param onPlay        Handler to start an offline user's video.
 */
const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  onStop,
  onPlay,
}) => {
  // Fallback mock data
  const mockOnline: UserStatus[] = [
    { email: 'u1@example.com', name: 'Mock Person 1' },
    { email: 'u2@example.com', name: 'Mock Person 2' },
    { email: 'u3@example.com', name: 'Mock Person 3' },
  ];
  const mockOffline: UserStatus[] = [
    { email: 'u4@example.com', name: 'Mock Person 4' },
    { email: 'u5@example.com', name: 'Mock Person 5' },
  ];

  const displayOnline  = onlineUsers.length  > 0 ? onlineUsers  : mockOnline;
  const displayOffline = offlineUsers.length > 0 ? offlineUsers : mockOffline;

  // Base and active link classes
  const linkBase   =
    'block py-2 pl-14 pr-3 rounded-md text-gray-300 transition-colors hover:text-[var(--color-secondary-hover)]';
  const activeLink = 'text-white font-semibold';

  return (
    <aside className="flex flex-col bg-[var(--color-primary)] text-white border-r border-black">
      {/* App header */}
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
        {/* Manage section */}
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

        {/* Monitor section */}
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

        {/* Online + Offline users */}
        <div className="px-6 py-4">
          <div className="text-xs font-semibold mb-2">Online</div>
          {displayOnline.map(u => (
            <OnlineUserItem key={u.email} user={u} onStop={onStop} />
          ))}

          <div className="text-xs font-semibold mt-4 mb-2">Offline</div>
          {displayOffline.map(u => (
            <OfflineUserItem key={u.email} user={u} onPlay={onPlay} />
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
