/**
 * @fileoverview useStreamSessionEvents hook types
 * @description Type definitions for useStreamSessionEvents hook
 */

import type React from 'react';
import type { CredsMap } from '../../../types';

/**
 * Options for useStreamSessionEvents hook
 */
export interface IUseStreamSessionEventsOptions {
  emailsRef: React.MutableRefObject<string[]>;
  setCredsMap: React.Dispatch<React.SetStateAction<CredsMap>>;
  clearStopStatusTimer: (email: string) => void;
}

