/**
 * @fileoverview Video grid layout utilities
 * @summary Helper functions for calculating video grid layouts
 * @description Utilities for calculating grid columns, item styles, and alignment classes based on number of video cards
 */

import type React from 'react';

/**
 * Calculates the number of columns for the grid based on item count
 */
export function calculateGridColumns(itemCount: number): number {
  if (itemCount === 1) return 1;
  if (itemCount === 2) return 2;
  if (itemCount === 3) return 2;
  if (itemCount === 4) return 2;
  return 3;
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

  if (totalCount === 3 && itemIndex === 2) {
    style.gridColumn = '1 / -1';
    style.justifySelf = 'center';
    style.maxWidth = '66%';
    style.width = '100%';
  }

  if (totalCount === 1) {
    style.gridColumn = '1 / -1';
    style.justifySelf = 'center';
    style.maxWidth = '80%';
    style.width = '100%';
  }

  return style;
}

/**
 * Calculates alignment class for grid items
 */
export function calculateAlignClass(itemIndex: number, totalCount: number): string {
  const cols = calculateGridColumns(totalCount);
  const rows = Math.ceil(totalCount / 3);
  const rowIndex = Math.floor(itemIndex / 3);
  const inLastRow = rowIndex === rows - 1;
  const itemsLast = totalCount - 3 * (rows - 1);
  const shouldCenter = cols === 3 && inLastRow && itemsLast > 0 && itemsLast < 3;
  
  return shouldCenter ? 'justify-self-center' : 'justify-self-stretch';
}

/**
 * Calculates portal minimum width based on item count
 */
export function calculatePortalMinWidth(itemCount: number): number | undefined {
  return itemCount > 5 ? 360 : undefined;
}

