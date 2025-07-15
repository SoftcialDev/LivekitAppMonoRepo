export interface UserStatus {
  azureAdObjectId: any
  status: string
  fullName: string
  email: string
  name:  string
  lastSeenAt?: string;  
  role?:           'Admin' | 'Supervisor' | 'Employee'; 
  
}
