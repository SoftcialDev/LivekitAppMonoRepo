/**
 * @fileoverview TrashButton component
 * @summary Reusable button component for delete actions
 * @description Button component for triggering delete actions with consistent styling
 */

import React from 'react';
import { TrashIcon } from '@/ui-kit/icons';
import type { ITrashButtonProps } from './types/buttonTypes';

/**
 * TrashButton component
 * 
 * Button for triggering delete actions. Displays a trash icon with
 * hover effects and optional custom styling. Shows loading spinner when
 * isLoading is true.
 * 
 * @param props - Component props
 * @returns JSX element with trash button
 */
export const TrashButton: React.FC<ITrashButtonProps> = ({
  onClick,
  className = 'p-1 hover:text-red-500 cursor-pointer transition-colors',
  title = 'Delete',
  disabled = false,
  isLoading = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      title={title}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <svg
          className="w-5 h-5 text-white animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <TrashIcon className="w-5 h-5 text-white" />
      )}
    </button>
  );
};

