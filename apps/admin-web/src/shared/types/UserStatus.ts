import { ManagerStatus } from "@/pages/ContactManager/hooks/useContactManagerStatus"

export interface UserStatus {
  azureAdObjectId: any;
  status: string;
  fullName: string;
  email: string;
  name: string;
  lastSeenAt?: string;
  role?: 'Admin' | 'Supervisor' | 'PSO' | 'ContactManager' | 'SuperAdmin';
  cmStatus?: ManagerStatus;
  supervisorId?: string | null;
  supervisorEmail?: string | null;
}
