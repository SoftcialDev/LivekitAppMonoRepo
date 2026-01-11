/**
 * @fileoverview Icon component type definitions
 * @summary Type definitions for icon components
 * @description Defines interfaces for icon components used throughout the application
 */

/**
 * Base props for icon components
 */
export interface IIconProps {
  /**
   * Custom CSS classes for the icon
   * 
   * Used to adjust size and styling.
   */
  className?: string;

  /**
   * Size of the icon (width and height)
   * 
   * Can be a CSS size value like '1em', '1.5rem', '24px', etc.
   * 
   * @default "1em"
   */
  size?: string;
}

/**
 * Props for CancelIcon component
 */
export interface ICancelIconProps extends IIconProps {
  /**
   * Custom CSS classes for the icon
   * 
   * Used to adjust size and styling. Default size is `w-7 h-7`.
   * 
   * @default "w-7 h-7"
   */
  className?: string;
}

/**
 * Props for PlusIcon component
 */
export interface IPlusIconProps extends IIconProps {
  /**
   * Custom CSS classes for the icon
   * 
   * Used to adjust size and styling. Default size is `w-10 h-10`.
   * 
   * @default "w-10 h-10"
   */
  className?: string;
}

