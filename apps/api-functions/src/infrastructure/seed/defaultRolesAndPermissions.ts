/**
 * @fileoverview defaultRolesAndPermissions - Seed for base roles and permissions (RBAC)
 * @description Creates base system roles, existing permissions and role-permission
 * assignments, and migrates current user role enum to multiple assignments in `user_roles` table
 */

import prisma from "../database/PrismaClientService";

type SeedRole = {
  name: string;
  displayName?: string;
  description?: string;
  isSystem?: boolean;
};

type SeedPermission = {
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
};

type RolePermissionMap = Record<string, string[]>;

const ROLES: SeedRole[] = [
  { name: "SuperAdmin", displayName: "Super Admin", isSystem: true },
  { name: "Admin", displayName: "Admin", isSystem: true },
  { name: "Supervisor", displayName: "Supervisor", isSystem: true },
  { name: "PSO", displayName: "PSO", isSystem: true },
  { name: "ContactManager", displayName: "Contact Manager", isSystem: true },
  { name: "Unassigned", displayName: "Unassigned", isSystem: true },
];

const PERMISSIONS: SeedPermission[] = [
  // Error logs
  { code: "error_logs:read", name: "Read error logs", resource: "error_logs", action: "read" },
  { code: "error_logs:delete", name: "Delete error logs", resource: "error_logs", action: "delete" },
  { code: "error_logs:resolve", name: "Resolve error logs", resource: "error_logs", action: "resolve" },

  // Snapshot reasons
  { code: "snapshot_reasons:read", name: "Read snapshot reasons", resource: "snapshot_reasons", action: "read" },
  { code: "snapshot_reasons:create", name: "Create snapshot reasons", resource: "snapshot_reasons", action: "create" },
  { code: "snapshot_reasons:update", name: "Update snapshot reasons", resource: "snapshot_reasons", action: "update" },
  { code: "snapshot_reasons:delete", name: "Delete snapshot reasons", resource: "snapshot_reasons", action: "delete" },

  // Snapshots
  { code: "snapshots:read", name: "Read snapshots", resource: "snapshots", action: "read" },
  { code: "snapshots:create", name: "Create snapshots", resource: "snapshots", action: "create" },
  { code: "snapshots:delete", name: "Delete snapshots", resource: "snapshots", action: "delete" },

  // Talk sessions
  { code: "talk_sessions:read", name: "Read talk sessions", resource: "talk_sessions", action: "read" },
  { code: "talk_sessions:check_active", name: "Check active talk session", resource: "talk_sessions", action: "check_active" },
  { code: "talk_sessions:start", name: "Start talk session", resource: "talk_sessions", action: "start" },
  { code: "talk_sessions:stop", name: "Stop talk session", resource: "talk_sessions", action: "stop" },
  { code: "talk_sessions:mute", name: "Mute talk session", resource: "talk_sessions", action: "mute" },
  { code: "talk_sessions:unmute", name: "Unmute talk session", resource: "talk_sessions", action: "unmute" },

  // Commands
  { code: "commands:send", name: "Send commands", resource: "commands", action: "send" },
  { code: "commands:acknowledge", name: "Acknowledge commands", resource: "commands", action: "acknowledge" },
  { code: "commands:read", name: "Read pending commands", resource: "commands", action: "read" },

  // Camera failures
  { code: "camera_failures:create", name: "Create camera failure report", resource: "camera_failures", action: "create" },
  { code: "camera_failures:read", name: "Read camera failure logs", resource: "camera_failures", action: "read" },

  // Users
  { code: "users:read", name: "Read users", resource: "users", action: "read" },
  { code: "users:create", name: "Create users", resource: "users", action: "create" },
  { code: "users:update", name: "Update users", resource: "users", action: "update" },
  { code: "users:delete", name: "Delete users", resource: "users", action: "delete" },
  { code: "users:change_role", name: "Change user role", resource: "users", action: "change_role" },
  { code: "users:change_supervisor", name: "Change user supervisor", resource: "users", action: "change_supervisor" },

  // Contact managers
  { code: "contact_managers:create", name: "Create contact manager", resource: "contact_managers", action: "create" },
  { code: "contact_managers:update", name: "Update contact manager", resource: "contact_managers", action: "update" },
  { code: "contact_managers:delete", name: "Delete contact manager", resource: "contact_managers", action: "delete" },
  { code: "contact_managers:read", name: "Read contact manager data", resource: "contact_managers", action: "read" },

  // Super admins
  { code: "super_admins:create", name: "Create super admin", resource: "super_admins", action: "create" },
  { code: "super_admins:delete", name: "Delete super admin", resource: "super_admins", action: "delete" },
  { code: "super_admins:read", name: "Read super admins", resource: "super_admins", action: "read" },

  // Recordings
  { code: "recordings:read", name: "Read recordings", resource: "recordings", action: "read" },
  { code: "recordings:delete", name: "Delete recordings", resource: "recordings", action: "delete" },
  { code: "recordings:start", name: "Start recording", resource: "recordings", action: "start" },
  { code: "recordings:stop", name: "Stop recording", resource: "recordings", action: "stop" },

  // Streaming status / presence
  { code: "streaming_status:read", name: "Read streaming status", resource: "streaming_status", action: "read" },
  
  // Streaming sessions
  { code: "streaming_sessions:read", name: "Read streaming sessions", resource: "streaming_sessions", action: "read" },
  { code: "streaming_sessions:read_history", name: "Read streaming session history", resource: "streaming_sessions", action: "read_history" },

  // PSO dashboard
  { code: "pso_dashboard:read", name: "Access PSO dashboard", resource: "pso_dashboard", action: "read" },

  // Migrations
  { code: "migrations:run", name: "Run migrations", resource: "migrations", action: "run" },

  // WebPubSub connect
  { code: "webpubsub:connect", name: "Connect to WebPubSub", resource: "webpubsub", action: "connect" },

  // Roles / permissions management
  { code: "roles:manage", name: "Manage roles", resource: "roles", action: "manage" },
  { code: "roles:assign", name: "Assign roles to users", resource: "roles", action: "assign" },
];

const ROLE_PERMISSIONS: RolePermissionMap = {
  SuperAdmin: PERMISSIONS.map((p) => p.code),
  Admin: [
    "error_logs:read",
    "error_logs:delete",
    "error_logs:resolve",
    "snapshot_reasons:read",
    "snapshot_reasons:create",
    "snapshot_reasons:update",
    "snapshot_reasons:delete",
    "snapshots:read",
    "snapshots:create",
    "talk_sessions:read",
    "talk_sessions:check_active",
    "talk_sessions:start",
    "talk_sessions:stop",
    "talk_sessions:mute",
    "talk_sessions:unmute",
    "commands:send",
    "commands:read",
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "users:change_role",
    "users:change_supervisor",
    "contact_managers:create",
    "contact_managers:update",
    "contact_managers:delete",
    "contact_managers:read",
    "streaming_status:read",
    "streaming_sessions:read",
    "streaming_sessions:read_history",
    "webpubsub:connect",
    "roles:assign",
  ],
  Supervisor: [
    "snapshot_reasons:read",
    "snapshots:read",
    "snapshots:create",
    "commands:send",
    "commands:read",
    "users:read",
    "users:change_role",
    "users:change_supervisor",
    "users:delete",
    "talk_sessions:check_active",
    "talk_sessions:start",
    "talk_sessions:stop",
    "talk_sessions:mute",
    "talk_sessions:unmute",
    "streaming_status:read",
    "streaming_sessions:read_history",
    "streaming_sessions:read",
    "webpubsub:connect",
    "contact_managers:read",
  ],
  PSO: [
    "commands:acknowledge",
    "commands:read",
    "camera_failures:create",
    "users:read",
    "streaming_status:read",
    "streaming_sessions:read_history",
    "contact_managers:read",
    "webpubsub:connect",
    "pso_dashboard:read",
  ],
  ContactManager: [
    "streaming_status:read",
    "streaming_sessions:read_history",
    "users:read",
    "webpubsub:connect",
  ],
  Unassigned: [],
};

/**
 * Creates base roles if they don't exist
 * @returns Map of role names to role IDs
 */
async function seedRoles(): Promise<Record<string, string>> {
  const roleIdByName: Record<string, string> = {};
  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({ where: { name: role.name } });
    if (existing) {
      roleIdByName[role.name] = existing.id;
      continue;
    }
    const created = await prisma.role.create({ data: { ...role, isSystem: role.isSystem ?? false, isActive: true } });
    roleIdByName[role.name] = created.id;
  }
  return roleIdByName;
}

/**
 * Creates base permissions if they don't exist
 * @returns Map of permission codes to permission IDs
 */
async function seedPermissions(): Promise<Record<string, string>> {
  const permIdByCode: Record<string, string> = {};
  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { code: perm.code } });
    if (existing) {
      permIdByCode[perm.code] = existing.id;
      continue;
    }
    const created = await prisma.permission.create({ data: { ...perm, isActive: true } });
    permIdByCode[perm.code] = created.id;
  }
  return permIdByCode;
}

/**
 * Assigns permissions to roles according to the defined mapping
 * @param roleIdByName - Map of role names to role IDs
 * @param permIdByCode - Map of permission codes to permission IDs
 */
async function seedRolePermissions(roleIdByName: Record<string, string>, permIdByCode: Record<string, string>): Promise<void> {
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIdByName[roleName];
    if (!roleId) continue;

    for (const code of permCodes) {
      const permId = permIdByCode[code];
      if (!permId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permId,
          },
        },
        update: { granted: true },
        create: {
          roleId,
          permissionId: permId,
          granted: true,
        },
      });
    }
  }
}

/**
 * Migrates current user role enum to user_roles table
 * @param roleIdByName - Map of role names to role IDs
 */
async function migrateUserRoles(roleIdByName: Record<string, string>): Promise<void> {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const roleName = user.role as keyof typeof roleIdByName;
    const roleId = roleIdByName[roleName];
    if (!roleId) continue;

    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId,
        },
      },
      update: { isActive: true },
      create: {
        userId: user.id,
        roleId,
        isActive: true,
      },
    });
  }
}

/**
 * Executes complete seed: roles, permissions, role-permission assignments and user migration
 * @description Creates all base roles and permissions, assigns permissions to roles,
 * and migrates existing user roles to the new user_roles table structure
 */
export async function seedDefaultRolesAndPermissions(): Promise<void> {
  const roleIdByName = await seedRoles();
  const permIdByCode = await seedPermissions();
  await seedRolePermissions(roleIdByName, permIdByCode);
  await migrateUserRoles(roleIdByName);
}

