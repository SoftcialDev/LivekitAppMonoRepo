/**
 * @fileoverview AddButton - Pill-shaped button with "+" icon and label
 * @summary Primary action button for confirm/submit actions
 * @description Renders a pill-shaped button with a circular "+" icon and label.
 * Used in modals and forms for primary actions like "Confirm", "Submit", "Add", etc.
 */

import React from 'react';
import type { IAddButtonProps } from './types';
import { PlusIcon } from '@/ui-kit/icons';

/**
 * AddButton component
 * 
 * Renders a pill-shaped button with:
 * - A circular icon containing a "+" cross, with a dark-primary border
 * - A label next to the icon
 * 
 * @param props - Component props
 * @returns A styled primary action button
 */
export const AddButton: React.FC<IAddButtonProps> = ({ 
  label, 
  onClick,
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      inline-flex items-center space-x-2
      px-4 py-2
      bg-[var(--color-secondary)]
      text-[var(--color-primary-dark)] font-semibold
      rounded-full
      hover:bg-[var(--color-secondary-hover)]
      transition-colors
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
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
      <PlusIcon className="w-10 h-10" />
    </span>

    <span>{label}</span>
  </button>
);

