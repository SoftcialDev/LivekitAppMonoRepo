/**
 * @fileoverview PaginationButton - Reusable button component for pagination controls
 * @summary Button component for Previous/Next navigation in pagination
 * @description Styled button component used in pagination controls with consistent
 * styling and disabled state handling
 */

import React from 'react';
import type { IPaginationButtonProps } from '../types';

/**
 * PaginationButton component
 * 
 * Renders a styled button for pagination controls with consistent styling
 * and proper disabled state handling.
 * 
 * @param props - Component props
 * @returns JSX element with a pagination button
 */
export const PaginationButton: React.FC<IPaginationButtonProps> = ({
  label,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        px-3 py-1 
        bg-[var(--color-primary)] 
        rounded 
        text-white 
        font-medium
        hover:bg-[var(--color-primary-light)]
        transition-colors
        disabled:opacity-50 
        disabled:cursor-not-allowed
      "
      type="button"
    >
      {label}
    </button>
  );
};

