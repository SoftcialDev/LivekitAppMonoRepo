/**
 * @fileoverview CancelButton - Pill-style button with cancel icon and label
 * @summary Cancel action button for modals and forms
 * @description Renders a pill-style button with a cancel icon and customizable label.
 * Used in modals and forms for cancel actions.
 */

import React from 'react';
import type { ICancelButtonProps } from './types';
import { CancelIcon } from '@/ui-kit/icons';

/**
 * CancelButton component
 * 
 * Renders a pill-style button with a cancel icon and label.
 * 
 * @param props - Component props
 * @returns A styled cancel action button
 */
export const CancelButton: React.FC<ICancelButtonProps> = ({
  onClick,
  label = 'Cancel',
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center space-x-2
      px-7 py-1
      border-2 border-[var(--color-secondary)]
      text-[var(--color-secondary)] font-semibold
      rounded-full
      hover:bg-[var(--color-primary)] hover:text-white
      transition-colors
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <CancelIcon />
    <span>{label}</span>
  </button>
);

