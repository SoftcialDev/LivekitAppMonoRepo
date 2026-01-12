/**
 * @fileoverview useStreamEmailChanges hook types
 * @description Type definitions for useStreamEmailChanges hook
 */

import type React from 'react';
import type { CredsMap, StreamingStatusInfo } from '../../../types';

/**
 * Options for useStreamEmailChanges hook
 */
export interface IUseStreamEmailChangesOptions {
  emails: string[];
  emailsRef: React.MutableRefObject<string[]>;
  credsMapRef: React.MutableRefObject<CredsMap>;
  lastEmailsRef: React.MutableRefObject<string[]>;
  setCredsMap: React.Dispatch<React.SetStateAction<CredsMap>>;
  updateCredsMapWithStatusInfo: (emails: string[], statusMap: Record<string, StreamingStatusInfo>) => void;
  mergeNewCredentials: (newCreds: CredsMap, targetEmails: string[]) => void;
  clearPendingTimer: (email: string) => void;
  clearRetryTimer: (email: string) => void;
  clearStartConnectionTimer: (email: string) => void;
  clearOne: (email: string) => void;
}

