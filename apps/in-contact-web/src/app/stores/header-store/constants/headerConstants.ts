/**
 * @fileoverview Header store constants
 * @summary Default values and constants for header store
 * @description Defines default header configuration and other constants
 */

import type { IHeaderInfo } from '../../../providers/types';

/**
 * Default header: empty title means pages/components should set their own
 */
export const DEFAULT_HEADER: IHeaderInfo = {
  title: '',
  iconSrc: undefined,
  iconAlt: undefined,
  iconNode: undefined,
};

