import React from "react";
import { NavLink } from "react-router-dom";
import IconWithLabel from "../../../components/IconWithLabel";
import camaraLogo from "@assets/InContact_logo.png";
import monitorIcon from "@assets/icon-monitor.png";
import UserItem from "../../auth/components/UserItem";
import type { UserStatus } from "../types/types";

export interface SidebarProps {
  /** List of users currently connected via WebSocket */
  onlineUsers: UserStatus[];
  /** List of users not connected via WebSocket */
  offlineUsers: UserStatus[];
  /** Mapping of user email to streaming state (true if streaming) */
  streamingMap: Record<string, boolean>;
  /**
   * Invoked when the Play or Stop button is clicked.
   * @param email – The user's email address
   * @param action – `"PLAY"` to start streaming, `"STOP"` to end streaming
   */
  onToggle: (email: string, action: "PLAY" | "STOP") => void;
}

/**
 * Sidebar navigation component.
 *
 * Renders:
 * - A “Manage” section with links for Admins, Supervisors, and PSOs.
 * - A “Monitor” section with a link to the dashboard.
 * - Two presence lists (Online and Offline) showing UserItem entries.
 *   If a list is empty, shows “No users online” or “No users offline”.
 *
 * @param props.onlineUsers    – Users with `status === "online"`
 * @param props.offlineUsers   – Users with `status === "offline"`
 * @param props.streamingMap   – Active streaming status by email
 * @param props.onToggle       – Callback for Play/Stop actions
 */
const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  streamingMap,
  onToggle,
}) => {
  const linkBase =
    "block py-2 pl-14 pr-3 rounded-md text-gray-300 transition-colors hover:text-[var(--color-secondary-hover)]";
  const activeLink = "text-white font-semibold";

  const shortName = (u: UserStatus) => {
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
            src={monitorIcon}
            alt="Manage"
            imgSize="h-5 w-5"
            textSize="text-xs font-semibold"
            className="flex items-center px-6 py-4"
          >
            Manage
          </IconWithLabel>
          <NavLink to="/admins"      className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}>Admins</NavLink>
          <NavLink to="/supervisors" className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}>Supervisors</NavLink>
          <NavLink to="/psos"         className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}>PSOs</NavLink>
        </div>

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
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}>PSOs streaming</NavLink>
        </div>

        <div className="px-6 py-4">
          <div className="text-xs font-semibold mb-2">Online</div>
          {onlineUsers.length === 0 ? (
            <div className="text-xs font-semibold text-[var(--color-tertiary)] ">No users online</div>
          ) : (
            onlineUsers.map(orig => {
              const name = shortName(orig);
              return (
                <UserItem
                  key={orig.email}
                  user={{ ...orig, name, fullName: name }}
                  isStreaming={!!streamingMap[orig.email]}
                  onToggle={onToggle}
                />
              );
            })
          )}

          <div className="text-xs font-semibold mt-4 mb-2">Offline</div>
          {offlineUsers.length === 0 ? (
            <div className="text-xl text-[var(--color-tertiary)] ">No users offline</div>
          ) : (
            offlineUsers.map(orig => {
              const name = shortName(orig);
              return (
                <UserItem
                  key={orig.email}
                  user={{ ...orig, name, fullName: name }}
                  isStreaming={false}
                  onToggle={onToggle}
                />
              );
            })
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
