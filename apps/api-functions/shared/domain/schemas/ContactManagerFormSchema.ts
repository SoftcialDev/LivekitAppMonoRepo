/**
 * @fileoverview ContactManagerFormSchema - Zod schema for contact manager form validation
 * @description Validates contact manager form request parameters
 */

import { z } from 'zod';
import { FormType } from '../enums/FormType';

/**
 * Zod schema for disconnections form validation
 */
const DisconnectionsSchema = z.object({
  formType: z.literal(FormType.DISCONNECTIONS),
  rnName: z.string().min(1, 'RN Name is required'),
  patientInitials: z.string().min(1, 'Patient Initials are required'),
  timeOfDisconnection: z.string().min(1, 'Time of Disconnection is required'),
  reason: z.string().min(1, 'Reason is required'),
  hospital: z.string().min(1, 'Hospital is required'),
  totalPatients: z.number().int().nonnegative('Total patients must be non-negative'),
  imageBase64: z.string().optional(),
});

/**
 * Zod schema for admissions form validation
 */
const AdmissionsSchema = z.object({
  formType: z.literal(FormType.ADMISSIONS),
  facility: z.string().min(1, 'Facility is required'),
  unit: z.string().min(1, 'Unit is required'),
  imageBase64: z.string().optional(),
});

/**
 * Zod schema for assistance form validation
 */
const AssistanceSchema = z.object({
  formType: z.literal(FormType.ASSISTANCE),
  facility: z.string().min(1, 'Facility is required'),
  patientInitials: z.string().min(1, 'Patient Initials are required'),
  totalPatientsInPod: z.number().int().nonnegative('Total patients in pod must be non-negative'),
  imageBase64: z.string().optional(),
});

/**
 * Main discriminated union schema for contact manager forms
 */
export const contactManagerFormSchema = z.discriminatedUnion('formType', [
  DisconnectionsSchema,
  AdmissionsSchema,
  AssistanceSchema,
]);

export type ContactManagerFormRequestData = z.infer<typeof contactManagerFormSchema>;
