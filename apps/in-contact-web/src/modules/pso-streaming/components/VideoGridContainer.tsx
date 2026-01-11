/**
 * @fileoverview VideoGridContainer component
 * @summary Container component for video card grid layout
 * @description Manages grid layout styling and structure for video cards
 */

import React from 'react';
import {
  calculateGridTemplateColumns,
  calculateItemStyle,
  calculateAlignClass,
  calculatePortalMinWidth,
} from '../utils/videoGridUtils';
import type { IVideoGridContainerProps, IVideoGridItemProps } from './types/videoGridTypes';

/**
 * Container component for video card grid
 * Handles responsive grid layout based on number of items
 */
export const VideoGridContainer: React.FC<IVideoGridContainerProps> = ({
  children,
  itemCount,
  className = '',
}) => {
  const gridTemplateColumns = calculateGridTemplateColumns(itemCount);

  return (
    <div
      className={`video-grid-container grid gap-4 grow transition-all duration-300 ease-in-out ${className}`}
      style={{
        gridTemplateColumns,
        paddingBottom: '260px',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Individual grid item wrapper with calculated styles
 */
export const VideoGridItem: React.FC<IVideoGridItemProps> = ({
  children,
  itemIndex,
  totalCount,
  className = '',
}) => {
  const itemStyle = calculateItemStyle(itemIndex, totalCount);
  const alignClass = calculateAlignClass(itemIndex, totalCount);

  return (
    <div
      className={`video-card-wrapper w-full h-full relative z-10 ${alignClass} ${className}`}
      style={itemStyle}
    >
      {children}
    </div>
  );
};

/**
 * Helper hook to get portal minimum width based on item count
 */
export function usePortalMinWidth(itemCount: number): number | undefined {
  return calculatePortalMinWidth(itemCount);
}

