/**
 * @fileoverview ResolvedBadge - Component for displaying resolved status with color coding
 * @summary Displays whether an error log is resolved or not
 * @description Renders a resolved status badge with color coding (green for resolved, red for unresolved).
 * Used in error log tables to quickly identify resolved vs unresolved errors.
 * 
 * Uses CSS utility classes defined in the global stylesheet for consistent theming.
 */

import React from 'react';
import type { IResolvedBadgeProps } from './types';

/**
 * ResolvedBadge component
 * 
 * Renders a resolved status badge with color coding based on the resolved state.
 * Uses CSS utility classes from the global stylesheet for consistent theming.
 * 
 * Colors (defined in CSS):
 * - Resolved: Green (var(--color-resolved)) with "Yes"
 * - Unresolved: Red (var(--color-unresolved)) with "No"
 * 
 * @param props - Component props
 * @returns JSX element with styled resolved badge
 * 
 * @example
 * ```tsx
 * <ResolvedBadge resolved={true} />
 * ```
 */
export const ResolvedBadge: React.FC<IResolvedBadgeProps> = ({ resolved }) => (
  <span className={resolved ? 'resolved' : 'unresolved'}>
    {resolved ? 'Yes' : 'No'}
  </span>
);

