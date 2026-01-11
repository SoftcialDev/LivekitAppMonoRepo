/**
 * @fileoverview DownloadButton component
 * @summary Reusable button component for file downloads
 * @description Button component for triggering file downloads with consistent styling
 */

import React from 'react';
import type { IDownloadButtonProps } from './types/buttonTypes';

/**
 * DownloadButton component
 * 
 * Button for triggering file downloads. Displays a download icon (📥) with
 * hover effects and optional custom styling.
 * 
 * @param props - Component props
 * @returns JSX element with download button
 */
export const DownloadButton: React.FC<IDownloadButtonProps> = ({
  onClick,
  className = 'p-1 hover:text-(--color-secondary)',
  title = 'Download',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      title={title}
      disabled={disabled}
    >
      📥
    </button>
  );
};

