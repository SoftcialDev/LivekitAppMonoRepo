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
 *
 * @property onlineUsers      - Users currently online.
 * @property offlineUsers     - Users currently offline.
 * @property loading          - Whether presence data is still loading.
 * @property isCollapsed      - Whether the sidebar is collapsed.
 * @property onToggleCollapse - Toggle-collapse callback.
 */
export interface SidebarProps {
  onlineUsers: UserStatus[];
  offlineUsers: UserStatus[];
  loading: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Role-filter dropdown options.
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
 * Mirrors the original styling/structure while adding:
 * 1. **Link-disabling rule** – A supervisor can only open a PSO stream
 *    when that PSO has `supervisorEmail === currentEmail`. Admins always
 *    retain access; Admin/Supervisor rows themselves stay non-clickable.
 * 2. **Supervisor name tag** – For each PSO the list now appends the
 *    supervisor’s short name in parentheses (uses `supervisorFullName`
 *    if provided on the user object).
 */
const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  loading,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { account }  = useAuth();
  const { handleChat } = useVideoActions();
  const currentEmail = account?.username ?? "";

  // ── Roles of the *viewer* ────────────────────────────────────────────────
  const claims   = (account?.idTokenClaims ?? {}) as Record<string, any>;
  const rawRoles = claims.roles ?? claims.role;
  const roles: string[] =
    Array.isArray(rawRoles) ? rawRoles
    : typeof rawRoles === "string" ? [rawRoles]
    : [];

  const isAdmin      = roles.includes("Admin");
  const isSupervisor = roles.includes("Supervisor");

  // ── Search / filter state ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]   = useState("");
  const [roleFilter, setRoleFilter]   = useState<string>("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const filterUsers = (list: UserStatus[]): UserStatus[] =>
    list.filter(u => {
      if (roleFilter && u.role !== roleFilter) return false;
      const text = (u.fullName ?? u.name ?? u.email).toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });

  const filteredOnline  = useMemo(
    () => filterUsers(onlineUsers),
    [onlineUsers,  searchTerm, roleFilter]
  );
  const filteredOffline = useMemo(
    () => filterUsers(offlineUsers),
    [offlineUsers, searchTerm, roleFilter]
  );

  const shortName = (u: UserStatus): string =>
    (u.fullName ?? u.name ?? u.email).trim().split(/\s+/).slice(0, 2).join(" ");

  /**
   * Determines whether a row’s video link should be disabled.
   *
   * • Admins can open any stream.  
   * • A supervisor may open only those PSOs whose `supervisorEmail`
   *   matches their own email.  
   * • Admin/Supervisor rows themselves stay non-clickable.
   */
  const disableLinkFor = (u: UserStatus): boolean => {
    // Never allow navigating *to* Admin/Supervisor rows
    if (u.role === "Admin" || u.role === "Supervisor") return true;

    if (u.role === "Employee" && isSupervisor) {
      const supEmail = (u as any).supervisorEmail as string | undefined;
      return supEmail !== currentEmail;   // disable if PSO not assigned to me
    }

    return false; // Admin viewers or matched supervisor viewers stay enabled
  };

  const linkBase   = "block py-2 pl-14 pr-3 rounded-md text-gray-300 hover:text-white";
  const activeLink = "text-white font-semibold";

  return (
    <aside
      className={
        `relative flex flex-col bg-[var(--color-primary)] text-white ` +
        `border-r border-black transition-all duration-300 ` +
        (isCollapsed ? "w-f overflow-hidden" : "w-[350px]")
      }
    >
      {/* Logo header */}
      <div className="border-b border-black px-6 py-4">
        <IconWithLabel
          src={camaraLogo}
          alt="In Contact"
          imgSize="h-4 sm:h-8"
          textSize="text-m sm:text-xl font-semibold"
          className="flex items-center"
        >
          In Contact
        </IconWithLabel>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {/* Manage section */}
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

        {/* Dashboard link */}
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

        {/* Filters + Lists */}
        <div className="px-6 py-4">
          {/* Search & role filter */}
          <IconWithLabel
            src={monitorIcon}
            alt="Users"
            imgSize="h-4 w-4"
            textSize="text-xs font-semibold"
            className="flex items-center mb-2"
          >
            Users
          </IconWithLabel>

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

          {/* User lists */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loading action="Loading presence…" />
            </div>
          ) : (
            <>
              {/* Online */}
              <div className="text-xs font-semibold mb-2">Online</div>
              {filteredOnline.length === 0 ? (
                <div className="text-xs font-semibold text-[var(--color-tertiary)]">
                  No users online
                </div>
              ) : (
                filteredOnline.map(u => {
                  const supName =
                    (u as any).supervisorFullName
                      ? (u as any).supervisorFullName
                      : (u as any).supervisorName ?? "";
                  const displayName = supName
                    ? `${shortName(u)} (${supName})`
                    : shortName(u);

                  return (
                    <UserItem
                      key={u.email}
                      user={{ ...u, fullName: displayName, name: displayName }}
                      onChat={() => handleChat(u.email)}
                      disableLink={disableLinkFor(u)}
                    />
                  );
                })
              )}

              {/* Offline */}
              <div className="text-xs font-semibold mt-4 mb-2">Offline</div>
              {filteredOffline.length === 0 ? (
                <div className="text-xs font-semibold text-[var(--color-tertiary)]">
                  No users offline
                </div>
              ) : (
                filteredOffline.map(u => {
                  const supName =
                    (u as any).supervisorFullName
                      ? (u as any).supervisorFullName
                      : (u as any).supervisorName ?? "";
                  const displayName = supName
                    ? `${shortName(u)} (${supName})`
                    : shortName(u);

                  return (
                    <UserItem
                      key={u.email}
                      user={{ ...u, fullName: displayName, name: displayName }}
                      onChat={() => handleChat(u.email)}
                      disableLink={disableLinkFor(u)}
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
