/**
 * @fileoverview Button component types
 * @summary Type definitions for video card button components
 * @description Interfaces for StartStopButton and ChatButton components
 */

/**
 * Props for StartStopButton component
 */
export interface IStartStopButtonProps {
  isLive: boolean;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
}

/**
 * Props for ChatButton component
 */
export interface IChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

