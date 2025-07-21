export interface PSOWithStatus {
  /** Canonical e-mail (primary key) */
  email: string;
  /** Full name ("Jane Doe"), falls back to name or email */
  fullName: string;
  /** Short label for the user (not used directly here) */
  name: string;
  /** "online" or "offline" */
  status: 'online' | 'offline';
  /** True if status is "online" */
  isOnline: boolean;
  supervisorName : string;
}
