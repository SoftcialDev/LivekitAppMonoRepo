/**
 * @fileoverview SeverityBadge - Component for displaying error severity with color coding
 * @summary Displays error severity level with appropriate color styling
 * @description Renders a severity badge with color coding based on the severity level.
 * Used in error log tables to visually distinguish severity levels.
 * 
 * Uses CSS utility classes defined in the global stylesheet for consistent theming.
 */

import React from 'react';
import { ErrorSeverity } from '../enums/errorLogsEnums';
import type { ISeverityBadgeProps } from './types';

/**
 * Gets the CSS class name for a given severity level
 * 
 * Maps ErrorSeverity enum values to corresponding CSS utility classes
 * defined in the global stylesheet (tailwind.css).
 * 
 * @param severity - Error severity level
 * @returns CSS class name for the severity level
 */
function getSeverityClassName(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.Critical:
      return 'severity-critical';
    case ErrorSeverity.High:
      return 'severity-high';
    case ErrorSeverity.Medium:
      return 'severity-medium';
    case ErrorSeverity.Low:
      return 'severity-low';
    default:
      return 'severity-default';
  }
}

/**
 * SeverityBadge component
 * 
 * Renders a severity badge with color coding based on the severity level.
 * Uses CSS utility classes from the global stylesheet for consistent theming.
 * 
 * Colors (defined in CSS):
 * - Critical: Red (var(--color-severity-critical))
 * - High: Orange (var(--color-severity-high))
 * - Medium: Yellow (var(--color-severity-medium))
 * - Low: Green (var(--color-severity-low))
 * - Default: Gray (var(--color-severity-default))
 * 
 * @param props - Component props
 * @returns JSX element with styled severity badge
 * 
 * @example
 * ```tsx
 * <SeverityBadge severity={ErrorSeverity.High} />
 * ```
 */
export const SeverityBadge: React.FC<ISeverityBadgeProps> = ({ severity }) => (
  <span className={getSeverityClassName(severity)}>
    {severity}
  </span>
);

