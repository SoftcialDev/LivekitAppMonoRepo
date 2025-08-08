import React from "react";

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Props for the SidebarToggle component.
 *
 * @property isCollapsed - Whether the sidebar is currently collapsed.
 * @property onToggle    - Callback to toggle the sidebar visibility.
 */
export interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * An always‑visible toggle icon to collapse or expand the sidebar.
 *
 * - Renders only the SVG by default (no background or border).
 * - On hover/focus, shows a circular background using the tertiary color.
 * - Stays outside of the sidebar so it never disappears.
 *
 * @param props — SidebarToggleProps
 * @returns JSX.Element
 */
const SidebarToggle: React.FC<SidebarToggleProps> = ({
  isCollapsed,
  onToggle,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    className="
      flex items-center justify-center
      p-1
      rounded-full
      bg-transparent
      hover:bg-[var(--color-tertiary)]
      focus:outline-none focus:ring-0
      transition-colors duration-150
    "
  >
    <svg
      className="w-6 h-6 text-gray-600 dark:text-neutral-400 transition-colors duration-150"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="#ABDE80">
        <path d="M11.726 5.263a.7.7 0 10-.952-1.026l-3.5 3.25a.7.7 0 000 1.026l3.5 3.25a.7.7 0 00.952-1.026L8.78 8l2.947-2.737z" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1 3.25A2.25 2.25 0 013.25 1h9.5A2.25 2.25 0 0115 3.25v9.5A2.25 2.25 0 0112.75 15h-9.5A2.25 2.25 0 011 12.75v-9.5zm2.25-.75a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h1.3v-11h-1.3zm9.5 11h-6.8v-11h6.8a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75z"
        />
      </g>
    </svg>
  </button>
);

export default SidebarToggle;
