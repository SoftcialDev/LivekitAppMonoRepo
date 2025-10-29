/**
 * @fileoverview Centralized mock for Prisma Client enums
 * @description Provides mock implementations of all Prisma enums for testing
 * Generated from schema.prisma - update this file when schema enums change
 * 
 * USAGE IN TESTS:
 * Add this at the TOP of your test file BEFORE any imports:
 * 
 * jest.mock('@prisma/client', () => require('../../mocks/prisma-enums').PrismaMock);
 * 
 * Then import enums normally:
 * import { UserRole, ContactManagerStatus } from '@prisma/client';
 */

/**
 * User roles in the system
 */
export const UserRole = {
  Supervisor: 'Supervisor',
  Admin: 'Admin',
  Employee: 'Employee',
  ContactManager: 'ContactManager',
  SuperAdmin: 'SuperAdmin',
  Unassigned: 'Unassigned',
} as const;

/**
 * Contact manager availability states
 */
export const ContactManagerStatus = {
  Unavailable: 'Unavailable',
  Available: 'Available',
  OnBreak: 'OnBreak',
  OnAnotherTask: 'OnAnotherTask',
} as const;

/**
 * Form types for contact manager submissions
 */
export const FormType = {
  Disconnections: 'Disconnections',
  Admissions: 'Admissions',
  Assistance: 'Assistance',
} as const;

/**
 * User connection status
 */
export const Status = {
  online: 'online',
  offline: 'offline',
} as const;

/**
 * Commands for employee streaming control
 */
export const CommandType = {
  START: 'START',
  STOP: 'STOP',
} as const;

/**
 * Recording session status
 */
export const RecordingStatus = {
  Active: 'Active',
  Completed: 'Completed',
  Failed: 'Failed',
} as const;

/**
 * Recording control commands
 */
export const RecordingCommandType = {
  START: 'START',
  STOP: 'STOP',
} as const;

/**
 * Camera start failure stages
 */
export const CameraFailureStage = {
  Permission: 'Permission',
  Enumerate: 'Enumerate',
  TrackCreate: 'TrackCreate',
  LiveKitConnect: 'LiveKitConnect',
  Publish: 'Publish',
  Unknown: 'Unknown',
} as const;

/**
 * Complete Prisma Client mock with all enums
 * Use this in jest.mock('@prisma/client', () => require('../../mocks/prisma-enums').PrismaMock)
 */
export const PrismaMock = {
  UserRole,
  ContactManagerStatus,
  FormType,
  Status,
  CommandType,
  RecordingStatus,
  RecordingCommandType,
  CameraFailureStage,
};

