/**
 * @fileoverview Dropdown type definitions
 * @summary Type definitions for dropdown component
 * @description Defines interfaces for dropdown component
 */

/**
 * Represents a single option in the dropdown menu
 */
export interface IDropdownOption {
  /**
   * Display label shown to the user
   */
  label: string;

  /**
   * Value associated with the option
   */
  value: string | number;
}

/**
 * Props for Dropdown component
 */
export interface IDropdownProps {
  /**
   * List of options to display in the dropdown
   */
  options: IDropdownOption[];

  /**
   * Currently selected value
   */
  value: string | number;

  /**
   * Callback invoked when an option is selected
   * 
   * @param value - The selected option value
   */
  onSelect: (value: string | number) => void;

  /**
   * Default label shown when no option is selected
   * 
   * @default "Select"
   */
  label?: string;

  /**
   * Additional class names applied to the outer wrapper
   * 
   * @default "relative inline-block"
   */
  className?: string;

  /**
   * Additional class names applied to the toggle button
   */
  buttonClassName?: string;

  /**
   * Additional class names applied to the dropdown menu container
   */
  menuClassName?: string;

  /**
   * Completely replaces the menu container class list
   * When provided, menuClassName is ignored
   */
  menuClassNameOverride?: string;

  /**
   * Overrides the background/text color classes used inside the dropdown
   * 
   * @default "bg-[var(--color-tertiary)] text-[var(--color-primary-dark)]"
   */
  menuBgClassName?: string;

  /**
   * Optional node rendered to the left of the current label inside the trigger button
   */
  leftAdornment?: React.ReactNode;

  /**
   * Optional inline styles applied to the dropdown menu container
   */
  menuStyle?: React.CSSProperties;
}

