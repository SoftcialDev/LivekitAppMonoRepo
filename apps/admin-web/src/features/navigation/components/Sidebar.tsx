import React from "react";
import { NavLink } from "react-router-dom";
import IconWithLabel from "../../../components/IconWithLabel";
import camaraLogo from "@assets/InContact_logo.png";
import monitorIcon from "@assets/icon-monitor.png";
import UserItem from "../../auth/components/UserItem";
import { useAuth } from "../../auth/hooks/useAuth";
import type { UserStatus } from "../types/types";
import { useVideoActions } from "@/features/videoDashboard/hooks/UseVideoAction";

export interface SidebarProps {
  onlineUsers:  UserStatus[];
  offlineUsers: UserStatus[];
}

const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
}) => {
  const { account } = useAuth();
  const { handleChat } = useVideoActions();

  // extract roles from MSAL's idTokenClaims
  const claims     = (account?.idTokenClaims ?? {}) as Record<string, any>;
  const rolesClaim = claims.roles ?? claims.role;
  const roles: string[] = Array.isArray(rolesClaim)
    ? rolesClaim
    : typeof rolesClaim === "string"
    ? [rolesClaim]
    : [];

  const isAdmin = roles.includes("Admin");
  const isSupervisor = roles.includes("Supervisor");

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

          {/* Supervisors may see Supervisors link */}
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

          {/* Everyone sees PSOs */}
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
            Monitor
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
          <div className="text-xs font-semibold mb-2">Online</div>
          {onlineUsers.length === 0 ? (
            <div className="text-xs font-semibold text-[var(--color-tertiary)]">
              No users online
            </div>
          ) : (
            onlineUsers.map((orig) => {
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
            offlineUsers.map((orig) => {
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
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
