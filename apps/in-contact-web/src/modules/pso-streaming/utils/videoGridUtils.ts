/**
 * @fileoverview Video grid layout utilities
 * @summary Helper functions for calculating video grid layouts
 * @description Utilities for calculating grid columns, item styles, and alignment classes based on number of video cards
 */

import type React from 'react';

/**
 * Breakpoint for medium screens (laptops)
 * Screens smaller than this width will use 4 columns instead of 5
 */
const MEDIUM_SCREEN_BREAKPOINT = 1536; // Tailwind's 2xl breakpoint

/**
 * Breakpoint for small screens (small laptops/tablets)
 * Screens smaller than this width will use 3 columns instead of 4
 */
const SMALL_SCREEN_BREAKPOINT = 1280; // Tailwind's xl breakpoint

/**
 * Calculates the number of columns for the grid based on item count and screen width
 * @param itemCount - Number of video cards to display
 * @param screenWidth - Current screen width in pixels (optional, defaults to window width)
 * @returns Number of columns for the grid
 */
export function calculateGridColumns(itemCount: number, screenWidth?: number): number {
  const width = screenWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const isMediumScreen = width < MEDIUM_SCREEN_BREAKPOINT;
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;

  if (itemCount === 1) return 1;
  if (itemCount === 2) return 2;
  if (itemCount === 3) return 3;
  if (itemCount === 4) return 4;
  if (itemCount >= 5 && itemCount <= 8) {
    return isSmallScreen ? 3 : 4;
  }
  
  if (isSmallScreen) return 3;
  if (isMediumScreen) return 4;
  return 5;
}

/**
 * Calculates grid template columns CSS value
 * @param itemCount - Number of video cards to display
 * @param screenWidth - Current screen width in pixels (optional)
 * @returns CSS grid template columns value
 */
export function calculateGridTemplateColumns(itemCount: number, screenWidth?: number): string {
  const cols = calculateGridColumns(itemCount, screenWidth);
  return `repeat(${cols}, minmax(0,1fr))`;
}

/**
 * Calculates item-specific styles based on position and total count
 */
export function calculateItemStyle(itemIndex: number, totalCount: number): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (totalCount === 1) {
    style.gridColumn = '1 / -1';
    style.justifySelf = 'center';
    style.maxWidth = '80%';
    style.width = '100%';
  }

  // For 3 and 4 items, they'll be in one row with equal columns, no special styling needed

  return style;
}

/**
 * Calculates alignment class for grid items
 * Centers items in the last row when they don't fill all columns
 * @param itemIndex - Index of the current item
 * @param totalCount - Total number of items
 * @param screenWidth - Current screen width in pixels (optional)
 * @returns CSS class for item alignment
 */
export function calculateAlignClass(itemIndex: number, totalCount: number, screenWidth?: number): string {
  const cols = calculateGridColumns(totalCount, screenWidth);
  const rows = Math.ceil(totalCount / cols);
  const rowIndex = Math.floor(itemIndex / cols);
  const inLastRow = rowIndex === rows - 1;
  const itemsInLastRow = totalCount % cols || cols;
  const shouldCenter = inLastRow && itemsInLastRow > 0 && itemsInLastRow < cols;
  
  return shouldCenter ? 'justify-self-center' : 'justify-self-stretch';
}

/**
 * Calculates portal minimum width based on item count
 */
export function calculatePortalMinWidth(itemCount: number): number | undefined {
  return itemCount > 5 ? 360 : undefined;
}

