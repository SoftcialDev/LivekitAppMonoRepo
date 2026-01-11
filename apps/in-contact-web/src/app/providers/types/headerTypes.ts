/**
 * @fileoverview Header type definitions
 * @summary Type definitions for header context and components
 * @description Defines interfaces for header context and related components
 */

import type { ReactNode } from 'react';

/**
 * Information for the header: title text and optional icon data
 * 
 * You may supply:
 * - iconSrc (string URL/imported asset) and iconAlt, OR
 * - iconNode: a ReactNode (e.g. a <UserIndicator />) for more flexible rendering.
 */
export interface IHeaderInfo {
  /**
   * Title text to display in the header
   */
  title: string;

  /**
   * Optional image source for the icon (URL or imported asset)
   */
  iconSrc?: string;

  /**
   * Optional alt text for the icon; used if iconSrc is provided
   */
  iconAlt?: string;

  /**
   * Optional ReactNode to render as icon. If provided, this takes priority over iconSrc.
   * Example usage: `<UserIndicator user={...} ... />`
   */
  iconNode?: ReactNode;
}

/**
 * Shape of HeaderContext: current header info and a setter function
 */
export interface IHeaderContextType {
  /**
   * Current header information
   */
  header: IHeaderInfo;

  /**
   * Update header information
   * 
   * @param info - New HeaderInfo to apply
   */
  setHeader: (info: IHeaderInfo) => void;
}

