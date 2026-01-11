/**
 * @fileoverview User Management API clients barrel export
 */

export {
  getUsersByRole,
  changeUserRole,
  deleteUser,
} from './adminClient';

export type { UserRoleParam } from '../types';

export {
  getSuperAdmins,
  createSuperAdmin,
  deleteSuperAdmin,
} from './superAdminClient';

export {
  getContactManagers,
  upsertContactManager,
  revokeContactManager,
} from './contactManagerClient';

export {
  transferPsos,
  changeSupervisor,
} from './supervisorClient';

export { createRoleBasedClient } from './utils';
export type { RoleBasedClientConfig } from './utils';

