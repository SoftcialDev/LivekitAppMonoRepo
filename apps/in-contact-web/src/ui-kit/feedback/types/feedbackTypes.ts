/**
 * @fileoverview Feedback component type definitions
 * @summary Type definitions for feedback UI components
 * @description Defines interfaces and types for feedback components like Loading, Toast, etc.
 */

/**
 * Props for Loading component
 */
export interface ILoadingProps {
  /**
   * The action to show in the subtitle (e.g., "loading data", "processing request")
   */
  action: string;

  /**
   * Tailwind classes for the overlay background
   * 
   * @default ""
   */
  bgClassName?: string;
}

