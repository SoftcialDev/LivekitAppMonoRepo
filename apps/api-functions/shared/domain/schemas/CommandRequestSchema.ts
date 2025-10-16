/**
 * @fileoverview CommandRequestSchema - Domain schema for command requests
 * @description Defines validation schema for camera command requests
 */

import { z } from 'zod';
import { CommandType } from '../enums/CommandType';

/**
 * Validation schema for camera command requests
 */
export const commandRequestSchema = z.object({
  command: z.nativeEnum(CommandType),
  employeeEmail: z.string().email(),
  reason: z.string().optional()
});

/**
 * Type for validated command request
 */
export type CommandRequest = z.infer<typeof commandRequestSchema>;
