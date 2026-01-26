/**
 * @fileoverview VideoGridContainer component
 * @summary Container component for video card grid layout
 * @description Manages grid layout styling and structure for video cards
 */

import React, { useState, useEffect } from 'react';
import {
  calculateGridTemplateColumns,
  calculateItemStyle,
  calculateAlignClass,
  calculatePortalMinWidth,
} from '../utils/videoGridUtils';
import type { IVideoGridContainerProps, IVideoGridItemProps } from './types/videoGridTypes';

/**
 * Hook to get current window width
 * @returns Current window width in pixels
 */
function useWindowWidth(): number {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  useEffect(() => {
    const handleResize = (): void => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

/**
 * Container component for video card grid
 * Handles responsive grid layout based on number of items and screen size
 */
export const VideoGridContainer: React.FC<IVideoGridContainerProps> = ({
  children,
  itemCount,
  className = '',
}) => {
  const screenWidth = useWindowWidth();
  const gridTemplateColumns = calculateGridTemplateColumns(itemCount, screenWidth);

  return (
    <div
      className={`video-grid-container grid gap-4 grow transition-all duration-300 ease-in-out overflow-y-auto ${className}`}
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
  const screenWidth = useWindowWidth();
  const itemStyle = calculateItemStyle(itemIndex, totalCount);
  const alignClass = calculateAlignClass(itemIndex, totalCount, screenWidth);

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

