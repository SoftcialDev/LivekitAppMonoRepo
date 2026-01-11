/**
 * @fileoverview Header store type definitions
 * @summary Type definitions for header store state
 * @description Defines interfaces for header store state and actions
 */

import type { IHeaderInfo } from '../../../providers/types';

/**
 * Header store state interface
 */
export interface IHeaderState {
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

  /**
   * Reset header to default
   */
  resetHeader: () => void;
}

