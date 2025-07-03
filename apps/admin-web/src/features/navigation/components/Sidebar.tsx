/**
 * Sidebar.tsx
 *
 * The application sidebar for In Contact. Displays navigation links for
 * Admins, Supervisors, PSOs, and PSOs Streaming pages, and shows real-time
 * presence lists of online and offline users with the ability to start a chat.
 */

import React from "react";
import { NavLink } from "react-router-dom";
import IconWithLabel from "../../../components/IconWithLabel";
import camaraLogo from "@assets/InContact_logo.png";
import monitorIcon from "@assets/icon-monitor.png";
import managementIcon from '@assets/manage_icon_sidebar.png';
import UserItem from "../../auth/components/UserItem";
import Loading from "@/components/Loading";
import { useAuth } from "../../auth/hooks/useAuth";
import type { UserStatus } from "../types/types";
import { useVideoActions } from "@/features/videoDashboard/hooks/UseVideoAction";

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Properties for the Sidebar component.
 *
 * @property onlineUsers  - Array of users currently online.
 * @property offlineUsers - Array of users currently offline.
 * @property loading      - Whether the presence data is still loading.
 */
export interface SidebarProps {
  onlineUsers:  UserStatus[];
  offlineUsers: UserStatus[];
  loading:      boolean;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * Sidebar
 *
 * Renders the main application sidebar with branding, navigation links,
 * and real-time presence lists. Shows:
 *   - In Contact logo
 *   - Links to Admins, Supervisors, PSOs, and PSOs Streaming (conditional)
 *   - A loading spinner while presence data is loading
 *   - Lists of online and offline users, each with a chat icon
 *
 * @param props - SidebarProps
 * @returns JSX.Element
 */
const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  loading,
}) => {
  const { account }    = useAuth();
  const { handleChat } = useVideoActions();

  // Extract roles from MSAL idTokenClaims
  const claims     = (account?.idTokenClaims ?? {}) as Record<string, any>;
  const rolesClaim = claims.roles ?? claims.role;
  const roles: string[] = Array.isArray(rolesClaim)
    ? rolesClaim
    : typeof rolesClaim === "string"
    ? [rolesClaim]
    : [];

  const isAdmin      = roles.includes("Admin");
  const isSupervisor = roles.includes("Supervisor");

  const linkBase   = "block py-2 pl-14 pr-3 rounded-md text-gray-300 hover:text-white";
  const activeLink = "text-white font-semibold";

  /**
   * Returns the first two words of the user's full name,
   * or falls back to the email if no name is set.
   *
   * @param u - The user status object.
   * @returns The shortened display name.
   */
  const shortName = (u: UserStatus): string => {
    const parts = (u.fullName ?? u.name ?? "").trim().split(/\s+/);
    return parts.slice(0, 2).join(" ");
  };

  return (
    <aside className="flex flex-col bg-[var(--color-primary)] text-white border-r border-black">
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
        <div className="border-b border-black">
          <IconWithLabel
            src={managementIcon}
            alt="Manage"
            imgSize="h-5 w-5"
            textSize="text-xs font-semibold"
            className="flex items-center px-6 py-4"
          >
            Manage
          </IconWithLabel>

          {isAdmin && (
            <NavLink
              to="/admins"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeLink : ""}`
              }
            >
              Admins
            </NavLink>
          )}

          {(isAdmin || isSupervisor) && (
            <NavLink
              to="/supervisors"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeLink : ""}`
              }
            >
              Supervisors
            </NavLink>
          )}

          <NavLink
            to="/psos"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ""}`
            }
          >
            PSOs
          </NavLink>
        </div>

        <div className="border-b border-black">
          <IconWithLabel
            src={monitorIcon}
            alt="Monitor"
            imgSize="h-5 w-5"
            textSize="text-xs font-semibold"
            className="flex items-center px-6 py-4"
          >
            PSOs Streaming
          </IconWithLabel>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ""}`
            }
          >
            PSOs streaming
          </NavLink>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loading action="Loading presence…" />
            </div>
          ) : (
            <>
            
              <div className="text-xs font-semibold mb-2">Online</div>
              {onlineUsers.length === 0 ? (
                <div className="text-xs font-semibold text-[var(--color-tertiary)]">
                  No users online
                </div>
              ) : (
                onlineUsers.map(orig => {
                  const name = shortName(orig);
                  return (
                    <UserItem
                      key={orig.email}
                      user={{ ...orig, name, fullName: name }}
                      onChat={handleChat}
                    />
                  );
                })
              )}

              <div className="text-xs font-semibold mt-4 mb-2">Offline</div>
              {offlineUsers.length === 0 ? (
                <div className="text-xs text-[var(--color-tertiary)]">
                  No users offline
                </div>
              ) : (
                offlineUsers.map(orig => {
                  const name = shortName(orig);
                  return (
                    <UserItem
                      key={orig.email}
                      user={{ ...orig, name, fullName: name }}
                      onChat={handleChat}
                    />
                  );
                })
              )}
            </>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
