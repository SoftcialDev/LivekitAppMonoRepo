import apiClient from "./apiClient";

//
// Data Types
//

/**
 * The possible statuses for a Contact Manager.
 */
export type ContactManagerStatus =
  | "Unavailable"
  | "Available"
  | "OnBreak"
  | "OnAnotherTask";

/**
 * DTO representing a Contact Manager profile.
 */
export interface ContactManagerProfile {
  /** Profile record UUID */
  id: string;
  /** The user’s Azure AD object ID */
  userId: string;
  /** The user’s email address */
  email: string;
  /** The user’s full display name */
  fullName: string;
  /** Current status */
  status: ContactManagerStatus;
  /** When this profile was created */
  createdAt: string;
  /** When this profile was last updated */
  updatedAt: string;
}

/**
 * Payload to create or update a Contact Manager.
 */
export interface UpsertContactManagerPayload {
  /** The PSO’s email address */
  email: string;
  /** Initial or new status */
  status: ContactManagerStatus;
}

/**
 * Payload to update only the status of a Contact Manager.
 */
export interface UpdateContactManagerStatusPayload {
  /** New status */
  status: ContactManagerStatus;
}

export interface ContactManagerDTO {
  id:        string;
  email:     string;
  fullName:  string;
  status:    'Unavailable' | 'Available' | 'OnBreak' | 'OnAnotherTask';
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for submitting a form to the Contact Managers endpoint.
 */
export interface ContactManagersFormPayload {
  /** Discriminates which form was submitted */
  formType: "Disconnections" | "Admissions" | "Assistance";
  // Disconnections fields
  rnName?: string;
  patientInitials?: string;
  timeOfDisconnection?: string;
  reason?: string;
  hospital?: string;
  totalPatients?: number;
  // Admissions fields
  facility?: string;
  unit?: string;
  assistanceWithAcutePatientAssessment?: string;
  facilityRepeat?: string;
  totalPatientsInPod?: number;
  // Assistance fields
  // (reuse facility, patientInitials, totalPatientsInPod)
  /** Optional base64-encoded JPEG snapshot */
  imageBase64?: string;
}


//
// API Functions
//

/**
 * Fetches all Contact Manager profiles.
 *
 * @returns Promise resolving to an array of {@link ContactManagerProfile}.
 *
 * @example
 * ```ts
 * const cms = await getContactManagers();
 * console.log(cms);
 * ```
 */
export async function getContactManagers(): Promise<ContactManagerProfile[]> {
  const res = await apiClient.get<{ contactManagers: ContactManagerProfile[] }>(
    "/api/contactManagers"
  );
  return Array.isArray(res.data.contactManagers) ? res.data.contactManagers : [];
}

/**
 * Creates a new Contact Manager profile (or updates existing), and assigns the AppRole.
 *
 * @param payload.email  – The user’s email.
 * @param payload.status – Initial status for the Contact Manager.
 * @returns Promise resolving to the newly upserted {@link ContactManagerProfile}.
 *
 * @example
 * ```ts
 * const newCm = await upsertContactManager({ email: "alice@contoso.com", status: "Available" });
 * console.log("Created:", newCm);
 * ```
 */
export async function upsertContactManager(
  payload: UpsertContactManagerPayload
): Promise<ContactManagerProfile> {
  const res = await apiClient.post<ContactManagerProfile>(
    "/api/contactManagers",
    payload
  );
  return res.data;
}

/**
 * Revokes the Contact Manager role (removes AppRole and deletes profile).
 *
 * @param profileId – The UUID of the profile to revoke.
 * @returns Promise resolving to void.
 *
 * @example
 * ```ts
 * await revokeContactManager("a1b2c3d4-...");
 * console.log("Revoked");
 * ```
 */
export async function revokeContactManager(profileId: string): Promise<void> {
  await apiClient.delete(`/api/contactManagers/${profileId}`);
}

/**
 * Updates the caller’s own status.
 *
 * @param status – New {@link ContactManagerStatus} to set.
 * @returns Promise resolving to the updated {@link ContactManagerProfile}.
 */
export async function updateContactManagerStatus(
  payload: UpdateContactManagerStatusPayload
): Promise<ContactManagerProfile> {
  const res = await apiClient.post<ContactManagerProfile>(
    '/api/contact-managers/me/status',
    payload
  );
  return res.data;
}

/**
 * Fetches a single Contact Manager profile, including its current status.
 *
 * @param profileId – The UUID of the ContactManagerProfile to fetch.
 * @returns Promise resolving to the {@link ContactManagerProfile}.
 *
 * @example
 * ```ts
 * const cm = await getContactManagerStatus("f0b36a1a-a70f-439f-a670-fc41542fe257");
 * console.log("Status is", cm.status);
 * ```
 */
export async function getContactManagerStatus(
): Promise<ContactManagerProfile> {
  const res = await apiClient.get<ContactManagerProfile>(
    `/api/contact-managers/me/status`
  );
  return res.data;
}


/**
 * Submits a form to the Contact Managers backend endpoint,
 * persists it, syncs the Teams chat, and returns the new record ID.
 *
 * @param formData - The full form payload, including formType and any relevant fields.
 * @returns Promise resolving to the newly created form’s UUID.
 *
 * @example
 * ```ts
 * const id = await submitContactManagersForm({
 *   formType: "Disconnections",
 *   rnName: "Jane Doe",
 *   patientInitials: "A.B.",
 *   timeOfDisconnection: "14:05",
 *   reason: "Network drop",
 *   hospital: "General Hospital",
 *   totalPatients: 5,
 *   imageBase64: optionalBase64String,
 * });
 * console.log("Created form record:", id);
 * ```
 */
export async function submitContactManagersForm(
  formData: ContactManagersFormPayload
): Promise<string> {
  const res = await apiClient.post<{ formId: string }>(
    "/api/contact-managers-form",
    formData
  );
  return res.data.formId;
}