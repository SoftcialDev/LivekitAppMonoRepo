import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import IconWithLabel from "../../../components/IconWithLabel";
import camaraLogo from "@assets/InContact_logo.png";
import monitorIcon from "@assets/icon-monitor.png";
import managementIcon from "@assets/manage_icon_sidebar.png";
import UserItem from "../../auth/components/UserItem";
import Loading from "@/components/Loading";
import { useAuth } from "../../auth/hooks/useAuth";
import type { UserStatus } from "../types/types";
import { useVideoActions } from "@/features/videoDashboard/hooks/UseVideoAction";
import { Dropdown } from "@/components/Dropdown";

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Props for the Sidebar component.
 */
export interface SidebarProps {
  /** List of currently online users. */
  onlineUsers: UserStatus[];
  /** List of currently offline users. */
  offlineUsers: UserStatus[];
  /** Whether the presence data is still loading. */
  loading: boolean;
}

/**
 * Role‐filter dropdown options.
 */
const ROLE_OPTIONS = [
  { label: "All users",   value: "" },
  { label: "Admins",      value: "Admin" },
  { label: "Supervisors", value: "Supervisor" },
  { label: "PSOs",        value: "Employee" },
] as const;

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * Sidebar
 *
 * Displays:
 * - Branding/logo
 * - Navigation links (Admins, Supervisors, PSOs, Dashboard)
 * - Presence filters (search + role dropdown)
 * - Lists of online and offline users
 *
 * @param props.onlineUsers   Array of online UserStatus objects.
 * @param props.offlineUsers  Array of offline UserStatus objects.
 * @param props.loading       Boolean flag: presence data loading.
 */
const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  loading,
}) => {
  // ─── Auth & Roles ──────────────────────────────────────────────────────────

  const { account } = useAuth();
  const { handleChat } = useVideoActions();

  // Extract roles from MSAL token claims
  const claims = (account?.idTokenClaims ?? {}) as Record<string, any>;
  const rawRoles = claims.roles ?? claims.role;
  const roles: string[] = Array.isArray(rawRoles)
    ? rawRoles
    : typeof rawRoles === "string"
      ? [rawRoles]
      : [];

  const isAdmin      = roles.includes("Admin");
  const isSupervisor = roles.includes("Supervisor");

  // ─── Search & Filter State ────────────────────────────────────────────────

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // ─── Filtered Lists ───────────────────────────────────────────────────────

  /**
   * Filters a list of users by search term and role.
   *
   * @param list - Array of UserStatus to filter.
   */
  const filterUsers = (
    list: UserStatus[]
  ): UserStatus[] =>
    list.filter(u => {
      if (roleFilter && u.role !== roleFilter) return false;
      const text = (u.fullName ?? u.name ?? u.email).toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });

  const filteredOnline  = useMemo(() => filterUsers(onlineUsers), [onlineUsers, searchTerm, roleFilter]);
  const filteredOffline = useMemo(() => filterUsers(offlineUsers), [offlineUsers, searchTerm, roleFilter]);

  // ─── Utility: Shorten Name ────────────────────────────────────────────────

  /**
   * Returns the first two words of the user's full name,
   * falling back to email if none.
   */
  const shortName = (u: UserStatus): string => {
    const parts = (u.fullName ?? u.name ?? "").trim().split(/\s+/);
    return parts.slice(0, 2).join(" ");
  };

  // ─── CSS Helpers ─────────────────────────────────────────────────────────

  const linkBase   = "block py-2 pl-14 pr-3 rounded-md text-gray-300 hover:text-white";
  const activeLink = "text-white font-semibold";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <aside className="flex flex-col bg-[var(--color-primary)] text-white border-r border-black">
      {/* Logo */}
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {/* Manage */}
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
            <NavLink to="/admins" className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ""}`
            }>
              Admins
            </NavLink>
          )}

          {(isAdmin || isSupervisor) && (
            <NavLink to="/supervisors" className={({ isActive }) =>
              `${linkBase} ${isActive ? activeLink : ""}`
            }>
              Supervisors
            </NavLink>
          )}

          <NavLink to="/psos" className={({ isActive }) =>
            `${linkBase} ${isActive ? activeLink : ""}`
          }>
            PSOs
          </NavLink>
        </div>

        {/* Dashboard */}
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

          <NavLink to="/dashboard" className={({ isActive }) =>
            `${linkBase} ${isActive ? activeLink : ""}`
          }>
            PSOs streaming
          </NavLink>
        </div>

        {/* Presence Filters & Lists */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loading action="Loading presence…" />
            </div>
          ) : (
            <>
              {/* Filters */}
              <IconWithLabel
                src={monitorIcon}
                alt="Users"
                imgSize="h-4 w-4"
                textSize="text-xs font-semibold"
                className="flex items-center mb-2"
              >
                Users
              </IconWithLabel>

              {/* Search box */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="
                    w-full px-4 py-2
                    bg-[var(--color-primary)]
                    text-white border border-white rounded-full
                    focus:outline-none focus:ring-0
                  "
                />
              </div>

              {/* Role dropdown */}
              <div className="mb-2">
                <Dropdown
                  options={ROLE_OPTIONS.map(r => ({ label: r.label, value: r.value }))}
                  value={roleFilter}
                  onSelect={v => setRoleFilter(String(v))}
                  className="w-full"
                  buttonClassName="w-full text-left text-sm bg-[var(--color-secondary)]"
                  menuClassName="bg-[var(--color-tertiary)] text-sm"
                />
              </div>

              {/* Online users */}
              <div className="text-xs font-semibold mb-2">Online</div>
              {filteredOnline.length === 0 ? (
                <div className="text-xs font-semibold text-[var(--color-tertiary)]">
                  No users online
                </div>
              ) : (
                filteredOnline.map(u => (
                  <UserItem
                    key={u.email}
                    user={{ ...u, fullName: shortName(u), name: shortName(u) }}
                    onChat={handleChat}
                    disableLink={u.role === "Admin" || u.role === "Supervisor"}
                  />
                ))
              )}

              {/* Offline users */}
              <div className="text-xs font-semibold mt-4 mb-2">Offline</div>
              {filteredOffline.length === 0 ? (
                <div className="text-xs font-semibold text-[var(--color-tertiary)]">
                  No users offline
                </div>
              ) : (
                filteredOffline.map(u => (
                  <UserItem
                    key={u.email}
                    user={{ ...u, fullName: shortName(u), name: shortName(u) }}
                    onChat={handleChat}
                    disableLink={u.role === "Admin" || u.role === "Supervisor"}
                  />
                ))
              )}
            </>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
