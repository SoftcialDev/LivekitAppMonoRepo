/**
 * @fileoverview UserQuerySchema - Zod schema for user query validation
 * @description Validates user query request parameters
 */

import { z } from "zod";
import { UserRole } from '@prisma/client';

const validRoles = [
  UserRole.Admin,
  UserRole.Supervisor, 
  UserRole.PSO,
  UserRole.ContactManager,
  UserRole.SuperAdmin,
  UserRole.Unassigned,
  'null' // Keep for backward compatibility
];

export const userQuerySchema = z.object({
  role: z.string()
    .min(1, 'Role parameter is required')
    .refine(val => {
      const roles = val.split(',').map(r => r.trim());
      return roles.every(r => validRoles.includes(r));
    }, 'Invalid role parameter'),
  page: z.preprocess(
    (val: unknown) => {
      if (val === undefined || val === null) return 1;
      if (typeof val === 'number') return val;
      const parsed = typeof val === 'string' ? parseInt(val, 10) : Number(val);
      return isNaN(parsed) ? 1 : parsed;
    },
    z.number().int().min(1, 'Page must be at least 1')
  ),
  pageSize: z.preprocess(
    (val: unknown) => {
      if (val === undefined || val === null) return 50;
      if (typeof val === 'number') return val;
      const parsed = typeof val === 'string' ? parseInt(val, 10) : Number(val);
      return isNaN(parsed) ? 50 : parsed;
    },
    z.number().int().min(1, 'Page size must be at least 1').max(1000, 'Page size must be at most 1000')
  )
});

export type UserQueryRequestData = z.infer<typeof userQuerySchema>;
