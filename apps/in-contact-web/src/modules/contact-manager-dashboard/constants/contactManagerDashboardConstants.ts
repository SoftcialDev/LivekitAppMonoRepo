/**
 * @fileoverview Contact Manager Dashboard constants
 * @summary Constants for Contact Manager Dashboard module
 * @description Defines constants used in Contact Manager Dashboard page
 */

import { ManagerStatus } from '../enums';

/**
 * Available status options for Contact Manager
 */
export const STATUS_OPTIONS = [
  ManagerStatus.Unavailable,
  ManagerStatus.Available,
  ManagerStatus.OnBreak,
  ManagerStatus.OnAnotherTask,
] as const;

