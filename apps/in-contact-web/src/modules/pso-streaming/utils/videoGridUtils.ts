/**
 * @fileoverview Video grid layout utilities
 * @summary Helper functions for calculating video grid layouts
 * @description Utilities for calculating grid columns, item styles, and alignment classes based on number of video cards
 */

import type React from 'react';

/**
 * Calculates the number of columns for the grid based on item count
 * 
 * Responsive column layout:
 * - 1 camera: 1 column (full width)
 * - 2 cameras: 2 columns
 * - 3 cameras: 3 columns (one row)
 * - 4 cameras: 4 columns (one row, same as 3)
 * - 5-8 cameras: 4 columns
 * - 9+ cameras: 5 columns
 */
export function calculateGridColumns(itemCount: number): number {
  if (itemCount === 1) return 1;
  if (itemCount === 2) return 2;
  if (itemCount === 3) return 3; // 3 columns, one row
  if (itemCount === 4) return 4; // 4 columns, one row (same as 3)
  if (itemCount >= 5 && itemCount <= 8) return 4;
  return 5; // 9+ cameras
}

/**
 * Calculates grid template columns CSS value
 */
export function calculateGridTemplateColumns(itemCount: number): string {
  const cols = calculateGridColumns(itemCount);
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
 * 
 * Centers items in the last row when they don't fill all columns
 */
export function calculateAlignClass(itemIndex: number, totalCount: number): string {
  const cols = calculateGridColumns(totalCount);
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

