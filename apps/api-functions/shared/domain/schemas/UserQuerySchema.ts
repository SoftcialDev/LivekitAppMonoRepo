/**
 * @fileoverview UserQuerySchema - Zod schema for user query validation
 * @description Validates user query request parameters
 */

import { z } from "zod";
import { UserRole } from '@prisma/client';

const validRoles = [
  UserRole.Admin,
  UserRole.Supervisor, 
  UserRole.Employee,
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
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 1)
    .refine(val => val >= 1, 'Page must be at least 1'),
  pageSize: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 50)
    .refine(val => val >= 1 && val <= 1000, 'Page size must be between 1 and 1000')
});

export type UserQueryRequestData = z.infer<typeof userQuerySchema>;
