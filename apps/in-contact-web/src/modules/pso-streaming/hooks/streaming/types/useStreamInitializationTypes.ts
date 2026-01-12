/**
 * @fileoverview useStreamInitialization hook types
 * @description Type definitions for useStreamInitialization hook
 */

import type React from 'react';
import type { CredsMap, StreamingStatusInfo } from '../../../types';

/**
 * Options for useStreamInitialization hook
 */
export interface IUseStreamInitializationOptions {
  emails: string[];
  credsMapRef: React.MutableRefObject<CredsMap>;
  setCredsMap: React.Dispatch<React.SetStateAction<CredsMap>>;
  updateCredsMapWithStatusInfo: (emails: string[], statusMap: Record<string, StreamingStatusInfo>) => void;
  isInitializedRef: React.MutableRefObject<boolean>;
}

