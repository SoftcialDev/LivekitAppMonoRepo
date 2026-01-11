/**
 * @fileoverview Video grid component types
 * @summary Type definitions for video grid components
 * @description Interfaces for VideoGridContainer and VideoGridItem components
 */

import type React from 'react';

/**
 * Props for VideoGridContainer component
 */
export interface IVideoGridContainerProps {
  children: React.ReactNode;
  itemCount: number;
  className?: string;
}

/**
 * Props for VideoGridItem component
 */
export interface IVideoGridItemProps {
  children: React.ReactNode;
  itemIndex: number;
  totalCount: number;
  className?: string;
}

