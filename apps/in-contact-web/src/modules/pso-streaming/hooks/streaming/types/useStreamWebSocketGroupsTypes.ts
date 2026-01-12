/**
 * @fileoverview useStreamWebSocketGroups hook types
 * @description Type definitions for useStreamWebSocketGroups hook
 */

import type React from 'react';

/**
 * Options for useStreamWebSocketGroups hook
 */
export interface IUseStreamWebSocketGroupsOptions {
  viewerEmail: string;
  emailsRef: React.MutableRefObject<string[]>;
  joinedGroupsRef: React.MutableRefObject<Set<string>>;
  emails: string[];
}

