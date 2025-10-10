import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import camaraLogo from "@/shared/assets/InContact_logo.png";
import monitorIcon from "@/shared/assets/icon-monitor.png";
import managementIcon from "@/shared/assets/manage_icon_sidebar.png";
import { useVideoActions } from "@/pages/Video/hooks/UseVideoAction";
import { useAuth } from "../auth/useAuth";
import { useUserInfo } from "../hooks/useUserInfo";
import { UserStatus } from "../types/UserStatus";
import { Dropdown } from "./Dropdown";
import IconWithLabel from "./IconWithLabel";
import Loading from "./Loading";
import UserItem from "./UserItem";
import {
  useContactManagerStatus,
  ManagerStatus,
} from "@/pages/ContactManager/hooks/useContactManagerStatus";
import { PsoDashboardForm } from '@/pages/PSO/components/PSODashboardForm';
import SidebarToggle from "./SidebarToggle";

/**
 * SidebarProps
 *
 * @property onlineUsers      Users currently online (presence feed).
 * @property offlineUsers     Users currently offline (presence feed).
 * @property loading          Whether presence data is loading.
 * @property isCollapsed      Whether the sidebar is collapsed.
 * @property onToggleCollapse Toggle the collapse state.
 */
export interface SidebarProps {
  onlineUsers: UserStatus[];
  offlineUsers: UserStatus[];
  loading: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/** Static role filter options (admins/supervisors view). */
const ROLE_OPTIONS = [
  { label: "All users", value: "" },
  { label: "Admins", value: "Admin" },
  { label: "Super Admins", value: "SuperAdmin" },
  { label: "Supervisors", value: "Supervisor" },
  { label: "PSOs", value: "Employee" },
  { label: "Contact Managers", value: "ContactManager" },
] as const;

/**
 * Sidebar
 * --------
 * - Admin / Supervisor / SuperAdmin:
 *   - Shows the standard nav (“Manage”, “PSOs streaming”) and all presence users,
 *     with optional role filter & search.
 * - Employee:
 *   - Narrows the list to **only their Contact Managers** (from `useContactManagerStatus`),
 *     tagging each CM as online/offline using the current presence `onlineUsers`.
 *   - Role dropdown is locked to “Contact Managers”.
 */
const Sidebar: React.FC<SidebarProps> = ({
  onlineUsers,
  offlineUsers,
  loading,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { account } = useAuth();
  const { userInfo } = useUserInfo();
  const { handleChat } = useVideoActions();
  const currentEmail = account?.username ?? "";
  const psoEmail   = currentEmail;
  const senderName = account?.name ?? "";

  // Get roles from database via UserInfoContext
  const userRole = userInfo?.role;
  const isAdmin = userRole === "Admin";
  const isSupervisor = userRole === "Supervisor";
  const isContactManager = userRole === "ContactManager";
  const isSuperAdmin = userRole === "SuperAdmin";
  const isEmployee = userRole === "Employee";

  /**
   * Contact managers assigned to the current viewer (Employee-only).
   * We’ll mark each CM as online/offline by intersecting with presence.
   */
  const { managers } = useContactManagerStatus(currentEmail);

  /** Employee-only: is there at least one CM with domain-status "Available"? */
const hasAvailableCM = useMemo(
  () => isEmployee && managers.some(m => (m.status as ManagerStatus) === 'Available'),
  [isEmployee, managers]
);

/** Small status dot for the dropdown trigger (green if any Available, else red). */
const cmFilterAdornment = useMemo(() => {
  if (!isEmployee) return null; // only Employees see the dot
  return (
    <span
      aria-label={hasAvailableCM ? 'Contact managers available' : 'No contact managers available'}
      title={hasAvailableCM ? 'At least one CM is Available' : 'No CM is Available'}
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        hasAvailableCM
          ? 'bg-[var(--color-secondary)]'        // green ✔️
          : 'bg-[var(--color-cm-unavailable)]'   // red  ❌ 
      }`}
    />
  );
}, [isEmployee, hasAvailableCM]);

  /** Fast lookup set of presence-online emails (lowercased). */
  const onlineSet = useMemo(
    () => new Set(onlineUsers.map((u) => u.email.toLowerCase())),
    [onlineUsers]
  );

  /**
   * Build the Employee’s “Contact Managers only” list as `UserStatus[]`.
   *
   * Notes:
   * - Removes the invalid `isOnline` property to satisfy `UserStatus`.
   * - Provides required `azureAdObjectId`; if your `UserStatus` type requires
   *   a non-null string, change `null` to `""`.
   */
  const employeeCMUsers = useMemo<UserStatus[]>(() => {
    if (!isEmployee) return [];

    return managers
      .filter((m) => !!m.email) // keep it simple; no type predicate needed
      .map((m) => {
        const email = m.email!;
        const isOnline = onlineSet.has(email.toLowerCase());
        const status = (isOnline ? "online" : "offline") as UserStatus["status"];

        const user: UserStatus = {
          email,
          role: "ContactManager",
          status,
          fullName: m.fullName ?? email,
          name: m.fullName ?? email,
          // Adjust if your model requires a non-null string:
          azureAdObjectId: null,
        };

        return user;
      });
  }, [isEmployee, managers, onlineSet]);

  /**
   * Role filter UI:
   * - For Employee viewers, lock the dropdown to “Contact Managers” and hide
   *   other roles by fixing the options to a single item.
   * - For Admin/Supervisor/SuperAdmin, use the full options.
   */
  const effectiveRoleOptions = isEmployee
    ? [{ label: "Contact Managers", value: "ContactManager" }]
    : ROLE_OPTIONS;

  // Search / role filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(
    isEmployee ? "ContactManager" : ""
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  /**
   * Source lists:
   * - Employee → override presence lists with their CM list (partitioned by status)
   * - Others   → use presence-provided lists directly
   */
  const sourceOnline: UserStatus[] = isEmployee
    ? employeeCMUsers.filter((u) => u.status === "online")
    : onlineUsers;

  const sourceOffline: UserStatus[] = isEmployee
    ? employeeCMUsers.filter((u) => u.status === "offline")
    : offlineUsers;

  /** Apply text + role filtering. */
  const filterUsers = (list: UserStatus[]): UserStatus[] =>
    list.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      const text = (u.fullName ?? u.name ?? u.email).toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });

  const filteredOnline = useMemo(
    () => filterUsers(sourceOnline),
    [sourceOnline, searchTerm, roleFilter]
  );
  const filteredOffline = useMemo(
    () => filterUsers(sourceOffline),
    [sourceOffline, searchTerm, roleFilter]
  );

  /** Format a short display name (First Last). */
  const shortName = (u: UserStatus): string =>
    (u.fullName ?? u.name ?? u.email).trim().split(/\s+/).slice(0, 2).join(" ");

  /**
   * Disable the “video link” for certain rows:
   * - Always disable for Admin/Supervisor/ContactManager/SuperAdmin rows.
   * - If the row is a PSO (Employee) and the viewer is a Supervisor,
   *   only enable if the PSO is assigned to the current supervisor.
   */
  const disableLinkFor = (u: UserStatus): boolean => {
    if (
      u.role === "Admin" ||
      u.role === "Supervisor" ||
      u.role === "ContactManager" ||
      u.role === "SuperAdmin"
    )
      return true;

    if (u.role === "Employee" && isSupervisor) {
      const supEmail = (u as any).supervisorEmail as string | undefined;
      return supEmail !== currentEmail;
    }
    return false;
  };

  // CM “availability” (domain status), if you want to annotate UserItem
  const cmStatusByEmail = useMemo(() => {
    const m = new Map<string, ManagerStatus>();
    managers.forEach((cm) => {
      if (cm.email) m.set(cm.email.toLowerCase(), cm.status as ManagerStatus);
    });
    return m;
  }, [managers]);

  const linkBase =
    "block py-2 pl-14 pr-3 rounded-md text-gray-300 hover:text-white";
  const activeLink = "text-white font-semibold";

  return (
    <aside
      className={
        `relative flex flex-col bg-[var(--color-primary)] text-white ` +
        `border-r border-black transition-all duration-300 ` +
        (isCollapsed ? "w-0 overflow-hidden" : "w-[350px]")
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
        {/* Manage + Dashboard section (hidden for Employee) */}
        {(isAdmin || isSupervisor || isSuperAdmin) && (
          <>
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

              {isSuperAdmin && (
                <NavLink
                  to="/superAdmins"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? activeLink : ""}`
                  }
                >
                  Super Admins
                </NavLink>
              )}

              {(isAdmin || isSuperAdmin) && (
                <NavLink
                  to="/admins"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? activeLink : ""}`
                  }
                >
                  Admins
                </NavLink>
              )}

              {(isAdmin || isSuperAdmin) && (
                <NavLink
                  to="/snapshotReport"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? activeLink : ""}`
                  }
                >
                  Snapshots Report
                </NavLink>
              )}

              {isSuperAdmin && (
                <NavLink
                  to="/recordingReport"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? activeLink : ""}`
                  }
                >
                  Recording Report
                </NavLink>
              )}

              {(isAdmin || isSuperAdmin) && (
                <NavLink
                  to="/contactManager"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? activeLink : ""}`
                  }
                >
                  Contact Manager
                </NavLink>
              )}

              {(isAdmin || isSupervisor || isSuperAdmin) && (
                <NavLink
                  to="/supervisors"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? activeLink : ""}`
                  }
                >
                  Supervisors
                </NavLink>
              )}

              {(isAdmin || isSupervisor || isSuperAdmin) && (
                <NavLink
                  to="/psos"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? activeLink : ""}`
                  }
                >
                  PSOs
                </NavLink>
              )}
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

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeLink : ""}`
                }
              >
                PSOs streaming
              </NavLink>
            </div>
          </>
        )}

        {isEmployee && (
  <div className="px-6 py-4 border-b border-black">
    <PsoDashboardForm
      psoEmail={psoEmail}
      senderName={senderName}
    />
  </div>
)}

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
              options={effectiveRoleOptions.map((r) => ({
                label: r.label,
                value: r.value,
              }))}
              value={roleFilter}
              onSelect={(v) => setRoleFilter(String(v))}
              className="w-full"
              buttonClassName="w-full text-left text-sm bg-[var(--color-tertiary)]"
              menuClassName="bg-[var(--color-tertiary)] text-sm w-72 ml-6"
              leftAdornment={cmFilterAdornment}
            />
          </div>

          {/* User lists with dynamic height based on content */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loading action="Loading presence…" />
            </div>
          ) : (
            <>
              {/* Online - Dynamic height based on content */}
              {filteredOnline.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold mb-2">Online ({filteredOnline.length})</div>
                  <div 
                    className="overflow-y-auto online-scroll-container custom-scrollbar"
                    style={{ 
                      maxHeight: filteredOnline.length <= 5 ? 'auto' : '128px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'var(--color-secondary) var(--color-primary)',
                      msOverflowStyle: 'scrollbar'
                    }}>
                    {filteredOnline.map((u) => {
                      const supName =
                        (u as any).supervisorFullName
                          ? (u as any).supervisorFullName
                          : (u as any).supervisorName ?? "";
                      const displayName = supName
                        ? `${shortName(u)} (${supName})`
                        : shortName(u);
                      const cmStatus = cmStatusByEmail.get(u.email.toLowerCase());

                      return (
                        <UserItem
                          key={u.email}
                          user={{
                            ...u,
                            fullName: displayName,
                            name: displayName,
                            cmStatus,
                          }}
                          onChat={() => handleChat(u.email)}
                          disableLink={disableLinkFor(u)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Offline - Dynamic height based on content */}
              {filteredOffline.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-2">Offline ({filteredOffline.length})</div>
                  <div 
                    className="overflow-y-auto offline-scroll-container custom-scrollbar"
                    style={{ 
                      maxHeight: filteredOffline.length <= 5 ? 'auto' : '128px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'var(--color-secondary) var(--color-primary)',
                      msOverflowStyle: 'scrollbar'
                    }}>
                    {filteredOffline.map((u) => {
                      const supName =
                        (u as any).supervisorFullName
                          ? (u as any).supervisorFullName
                          : (u as any).supervisorName ?? "";
                      const displayName = supName
                        ? `${shortName(u)} (${supName})`
                        : shortName(u);
                      const cmStatus = cmStatusByEmail.get(u.email.toLowerCase());

                      return (
                        <UserItem
                          key={u.email}
                          user={{
                            ...u,
                            fullName: displayName,
                            name: displayName,
                            cmStatus,
                          }}
                          onChat={() => handleChat(u.email)}
                          disableLink={disableLinkFor(u)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Show message when no users at all */}
              {filteredOnline.length === 0 && filteredOffline.length === 0 && (
                <div className="text-xs font-semibold text-[var(--color-tertiary)] text-center py-4">
                  No users found
                </div>
              )}
            </>
          )}
        </div>
      </nav>
      
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-primary);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-secondary);
          border-radius: 4px;
          border: 1px solid var(--color-primary);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-tertiary);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: var(--color-primary);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
