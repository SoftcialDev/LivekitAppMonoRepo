import React from 'react';

/**
 * Props for the AddButton component.
 */
export interface AddButtonProps {
  /** The text to display, e.g. "Add Admin", "Add Supervisor". */
  label: string;
  /** Click handler for the button. */
  onClick?: () => void;
}

/**
 * AddButton
 *
 * Renders a pill‐shaped button with:
 *  • A circular icon containing a “+” cross, with a dark-primary border.
 *  • A label next to the icon.
 *
 * @param props.label   The text to display.
 * @param props.onClick Optional click handler.
 */
const AddButton: React.FC<AddButtonProps> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="
      inline-flex items-center space-x-2
      px-4 py-2
      bg-[var(--color-secondary)]
      text-[var(--color-primary-dark)] font-semibold
      rounded-full
      hover:bg-[var(--color-secondary-hover)]
      transition-colors
      cursor-pointer
    "
  >
    {/* Circle + icon */}
    <span
      className="
        w-6 h-6
        flex items-center justify-center
        bg-[var(--color-secondary)]
        border-2 border-[var(--color-primary-dark)]
        rounded-full
      "
    >
      <svg
        viewBox="0 0 24 24"
        className="w-10 h-10"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </span>

    <span>{label}</span>
  </button>
);

export default AddButton;
