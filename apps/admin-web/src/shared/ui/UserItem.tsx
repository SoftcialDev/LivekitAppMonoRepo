import React from "react";
import { UserStatus } from "../types/UserStatus";
import UserIndicator from "./UserIndicator";

/**
 * Contact Manager availability states used to tint the online indicator.
 *
 * - `"Available"`     → online (green)
 * - `"OnBreak"`       → online (amber)
 * - `"OnAnotherTask"` → online (blue)
 * - `"Unavailable"`   → online (red)  ← changed: show a red dot instead of the offline pill
 *
 * Make sure your CSS defines:
 * - `--color-secondary`       (green)
 * - `--color-cm-break`        (amber)
 * - `--color-cm-busy`         (blue)
 * - `--color-cm-unavailable`  (red)
 */
export type ManagerStatus = "Unavailable" | "Available" | "OnBreak" | "OnAnotherTask";

/**
 * Props for {@link UserItem}.
 *
 * @property user        The user to display. Optionally includes a Contact Manager
 *                       availability state as `cmStatus` for role `"ContactManager"`.
 * @property onChat      Callback invoked when the “Chat” button is pressed.
 * @property disableLink When `true`, the user’s name/indicator should not navigate.
 */
export interface UserItemProps {
  user: UserStatus & { cmStatus?: ManagerStatus };
  onChat: (email: string) => void;
  disableLink?: boolean;
}

/**
 * UserItem
 * --------
 * Renders a single row for a user with:
 * - Presence badge + name (clickable unless `disableLink`).
 * - A “Chat” action on the right.
 *
 * Contact Managers get a color-coded indicator **while online**:
 * - `Available` → `var(--color-secondary)` (green)
 * - `OnBreak` → `var(--color-cm-break)` (amber)
 * - `OnAnotherTask` → `var(--color-cm-busy)` (blue)
 * - `Unavailable` → `var(--color-cm-unavailable)` (**red**, not the offline icon)
 *
 * Truly offline users (i.e., `user.status !== "online"`) still show the gray
 * offline pill and tertiary text.
 */
const UserItem: React.FC<UserItemProps> = ({ user, onChat, disableLink = false }) => {
  // Microsoft Teams–style brand chat icon
  const brandIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-tertiary)"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 7h10v10h-10z" />
      <path d="M6 10h4" />
      <path d="M8 10v4" />
      <path d="M8.104 17c.47 2.274 2.483 4 4.896 4a5 5 0 0 0 5 -5v-7h-5" />
      <path d="M18 18a4 4 0 0 0 4 -4v-5h-4" />
      <path d="M13.003 8.83a3 3 0 1 0 -1.833 -1.833" />
      <path d="M15.83 8.36a2.5 2.5 0 1 0 .594 -4.117" />
    </svg>
  );

  // Offline pill icon (used only when the user is actually offline)
  const offlineIcon = (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="var(--color-tertiary)"
        fillRule="evenodd"
        d="M5.781 4.414a7 7 0 019.62 10.039l-9.62-10.04zm-1.408 1.42a7 7 0 009.549 9.964L4.373 5.836zM10 1a9 9 0 100 18 9 9 0 000-18z"
        clipRule="evenodd"
      />
    </svg>
  );

  // Name color: white when online, tertiary when offline
  const nameClass =
    user.status === "online"
      ? "font-light text-white truncate"
      : "text-[var(--color-tertiary)] truncate";

  // Contact Manager indicator color logic
  const isCM = user.role === "ContactManager";
  const cmStatus = user.cmStatus;

  // Default online indicator color (green)
  let indicatorBgClass = "bg-[var(--color-secondary)]";

  if (user.status === "online" && isCM) {
    if (cmStatus === "OnBreak") {
      indicatorBgClass = "bg-[var(--color-cm-break)]"; // amber
    } else if (cmStatus === "OnAnotherTask") {
      indicatorBgClass = "bg-[var(--color-cm-busy)]"; // blue
    } else if (cmStatus === "Unavailable") {
      indicatorBgClass = "bg-[var(--color-cm-unavailable)]"; // Red
    } else if (cmStatus === "Available") {
      indicatorBgClass = "bg-[var(--color-secondary)]"; // green
    }
  }

  // Show the online dot whenever the user is online
  const isOnline = user.status === "online";

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <UserIndicator
            user={user}
            disableLink={disableLink}
            outerClass="w-8 h-8"
            innerClass="w-4 h-4"
            bgClass={indicatorBgClass}
            borderClass="border-2 border-[var(--color-primary-dark)]"
            nameClass={`${nameClass} hover:text-[var(--color-secondary-hover)]`}
          />
        ) : (
          <>
            <span className="w-6 h-6 flex-shrink-0" aria-hidden="true">
              {offlineIcon}
            </span>
            <span
              className={`${nameClass} hover:text-[var(--color-secondary-hover)] ${
                disableLink ? "cursor-default" : "cursor-pointer"
              }`}
            >
              {user.name}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChat(user.email)}
        className="
          flex items-center space-x-1
          px-2 py-1
          bg-transparent hover:bg-[rgba(255,255,255,0.1)]
          rounded cursor-pointer transition-colors
        "
        aria-label={`Open chat with ${user.name ?? user.email}`}
      >
        <span className="flex-shrink-0">{brandIcon}</span>
        <span className="text-[var(--color-tertiary)]">Chat</span>
      </button>
    </div>
  );
};

export default UserItem;
