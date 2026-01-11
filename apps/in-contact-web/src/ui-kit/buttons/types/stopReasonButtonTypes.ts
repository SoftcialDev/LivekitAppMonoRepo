/**
 * @fileoverview StopReasonButton component types
 * @summary Type definitions for StopReasonButton component
 * @description Type definitions for StopReasonButton component props and options
 */

import type { StreamingStopReason } from '@/modules/pso-streaming/enums/streamingStopReason';

/**
 * Stop reason options with labels and descriptions
 */
export interface StopReasonOption {
  value: StreamingStopReason;
  label: string;
  description: string;
}

/**
 * Props for StopReasonButton component
 */
export interface IStopReasonButtonProps {
  /**
   * Callback when a stop reason is selected
   */
  onSelect: (reason: StreamingStopReason) => void;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Button content/children
   */
  children: React.ReactNode;
}

