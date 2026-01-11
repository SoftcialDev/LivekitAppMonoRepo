/**
 * @fileoverview Button component type definitions
 * @summary Type definitions for button components
 * @description Defines interfaces for button components used in modals and forms
 */

/**
 * Props for AddButton component
 */
export interface IAddButtonProps {
  /**
   * The text to display on the button
   */
  label: string;

  /**
   * Click handler for the button
   */
  onClick?: () => void;

  /**
   * Whether the button is disabled
   * 
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for CancelButton component
 */
export interface ICancelButtonProps {
  /**
   * Handler invoked when the button is clicked
   */
  onClick: () => void;

  /**
   * Text to display alongside the icon
   * 
   * @default "Cancel"
   */
  label?: string;

  /**
   * Whether the button is disabled
   * 
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for SignInButton component
 */
export interface ISignInButtonProps {
  /**
   * Function to call when the button is clicked
   */
  onClick: () => void | Promise<void>;

  /**
   * Whether the button is in a loading state
   * 
   * @default false
   */
  isLoading?: boolean;
}

/**
 * Props for DownloadButton component
 */
export interface IDownloadButtonProps {
  /**
   * Callback invoked when button is clicked
   */
  onClick: () => void;

  /**
   * Additional CSS classes for the button
   * 
   * @default "p-1 hover:text-[var(--color-secondary)]"
   */
  className?: string;

  /**
   * Tooltip text shown on hover
   * 
   * @default "Download"
   */
  title?: string;

  /**
   * Whether the button is disabled
   * 
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for TrashButton component
 */
export interface ITrashButtonProps {
  /**
   * Callback invoked when button is clicked
   */
  onClick: () => void;

  /**
   * Additional CSS classes for the button
   * 
   * @default "p-1 hover:text-red-500 cursor-pointer transition-colors"
   */
  className?: string;

  /**
   * Tooltip text shown on hover
   * 
   * @default "Delete"
   */
  title?: string;

  /**
   * Whether the button is disabled
   * 
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the button is in loading state
   * 
   * @default false
   */
  isLoading?: boolean;
}

/**
 * Props for ClearButton component
 */
export interface IClearButtonProps {
  /**
   * Callback invoked when button is clicked
   */
  onClick: () => void;

  /**
   * Tooltip text shown on hover
   * 
   * @default "Clear"
   */
  title?: string;

  /**
   * Additional CSS classes for the button
   */
  className?: string;
}

