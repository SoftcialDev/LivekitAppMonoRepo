import React from 'react';
import CancelIcon from '../Buttons/CancelIcon';

export interface CancelButtonProps {
  /** Handler invoked when the button is clicked. */
  onClick: () => void;
  /** Text to display alongside the icon; defaults to "Cancel". */
  label?: string;
}

/**
 * Renders a pill-style button with a cancel icon and label.
 *
 * @param props.onClick - Function to call on click.
 * @param props.label - Button text; defaults to "Cancel".
 * @returns A styled cancel action button.
 */
const CancelButton: React.FC<CancelButtonProps> = ({
  onClick,
  label = 'Cancel',
}) => (
  <button
    onClick={onClick}
    className="
      flex items-center space-x-2
      px-7 py-1
      border-2 border-[var(--color-secondary)]
      text-[var(--color-secondary)] font-semibold
      rounded-full
      hover:bg-[var(--color-primary)] hover:text-white
      transition-colors
    "
  >
    <CancelIcon />
    <span>{label}</span>
  </button>
);

export default CancelButton;
