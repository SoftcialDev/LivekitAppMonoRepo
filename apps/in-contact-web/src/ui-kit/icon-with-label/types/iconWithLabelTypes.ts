/**
 * @fileoverview IconWithLabel type definitions
 * @summary Type definitions for IconWithLabel component
 * @description Defines interfaces for IconWithLabel component
 */

/**
 * Props for IconWithLabel component
 */
export interface IIconWithLabelProps {
  /**
   * Image source URL or imported asset path
   */
  src: string;

  /**
   * Alt text for the image
   */
  alt?: string;

  /**
   * Tailwind classes for img size (e.g. "h-8 sm:h-10 md:h-12")
   */
  imgSize?: string;

  /**
   * Tailwind classes for text size (e.g. "text-xl sm:text-2xl md:text-3xl")
   */
  textSize?: string;

  /**
   * If true, wrapper div gets w-full h-full
   */
  fillContainer?: boolean;

  /**
   * Extra classes to add to the wrapper div
   */
  className?: string;

  /**
   * Text or nodes to render as label next to the icon
   */
  children: React.ReactNode;
}

