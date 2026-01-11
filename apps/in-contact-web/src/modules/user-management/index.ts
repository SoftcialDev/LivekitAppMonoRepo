/**
 * @fileoverview User Management module barrel export
 */

// Routes
export { userManagementRoutes } from './routes';

// Pages
export { AdminPage, SuperAdminPage } from './pages';

// Components
export { UserManagementPage } from './components';

// Hooks
export { useUserManagementPage } from './hooks';

// Types
export type {
  UserByRole,
  SuperAdminDto,
  ContactManagerDto,
  ContactManagerStatus,
  PagedResponse,
  ChangeUserRoleRequest,
  ChangeSupervisorRequest,
  ChangeSupervisorResponse,
  DeleteUserRequest,
  CreateSuperAdminRequest,
  CreateSuperAdminResponse,
  BaseUserManagementItem,
  CandidateUser,
  UserManagementConfig,
  UseUserManagementPageReturn,
  IUserManagementPageProps,
} from './types';

// API
export {
  getUsersByRole,
  changeUserRole,
  deleteUser,
  getSuperAdmins,
  createSuperAdmin,
  deleteSuperAdmin,
} from './api';

