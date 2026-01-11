/**
 * @fileoverview Detail component type definitions
 * @summary Type definitions for detail field components
 * @description Defines interfaces for detail field components used in detail views
 */

import type React from 'react';

/**
 * Props for DetailField component
 * 
 * Reusable component for displaying a label-value pair in detail views.
 * Commonly used in modals and detail pages to show structured information.
 */
export interface IDetailFieldProps {
  /**
   * Label text to display above the value
   */
  label: string;

  /**
   * Value content to display (text, React node, or null)
   */
  value: React.ReactNode;

  /**
   * Whether the value should use monospace font (for IDs, codes, etc.)
   * 
   * @default false
   */
  monospace?: boolean;

  /**
   * Custom CSS class for the value element
   */
  valueClassName?: string;

  /**
   * Custom CSS class for the label element
   */
  labelClassName?: string;

  /**
   * Custom CSS class for the container div
   */
  className?: string;
}

