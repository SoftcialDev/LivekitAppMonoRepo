/**
 * @fileoverview Permission - Enumeration of all system permissions
 * @summary Defines all available permissions in the RBAC system
 * @description Enum representing all permissions that can be assigned to roles
 */

/**
 * Enumeration of all system permissions
 * @description Defines all permissions available in the system using the format: resource:action
 */
export enum Permission {
  // Error logs
  ErrorLogsRead = "error_logs:read",
  ErrorLogsDelete = "error_logs:delete",
  ErrorLogsResolve = "error_logs:resolve",

  // Snapshot reasons
  SnapshotReasonsRead = "snapshot_reasons:read",
  SnapshotReasonsCreate = "snapshot_reasons:create",
  SnapshotReasonsUpdate = "snapshot_reasons:update",
  SnapshotReasonsDelete = "snapshot_reasons:delete",

  // Snapshots
  SnapshotsRead = "snapshots:read",
  SnapshotsCreate = "snapshots:create",
  SnapshotsDelete = "snapshots:delete",

  // Talk sessions
  TalkSessionsRead = "talk_sessions:read",
  TalkSessionsCheckActive = "talk_sessions:check_active",
  TalkSessionsStart = "talk_sessions:start",
  TalkSessionsStop = "talk_sessions:stop",
  TalkSessionsMute = "talk_sessions:mute",
  TalkSessionsUnmute = "talk_sessions:unmute",

  // Commands
  CommandsSend = "commands:send",
  CommandsAcknowledge = "commands:acknowledge",
  CommandsRead = "commands:read",

  // Camera failures
  CameraFailuresCreate = "camera_failures:create",
  CameraFailuresRead = "camera_failures:read",

  // Users
  UsersRead = "users:read",
  UsersCreate = "users:create",
  UsersUpdate = "users:update",
  UsersDelete = "users:delete",
  UsersChangeRole = "users:change_role",
  UsersChangeSupervisor = "users:change_supervisor",

  // Contact managers
  ContactManagersCreate = "contact_managers:create",
  ContactManagersUpdate = "contact_managers:update",
  ContactManagersDelete = "contact_managers:delete",
  ContactManagersRead = "contact_managers:read",

  // Super admins
  SuperAdminsCreate = "super_admins:create",
  SuperAdminsDelete = "super_admins:delete",
  SuperAdminsRead = "super_admins:read",

  // Recordings
  RecordingsRead = "recordings:read",
  RecordingsDelete = "recordings:delete",
  RecordingsStart = "recordings:start",
  RecordingsStop = "recordings:stop",

  // Streaming status / presence
  StreamingStatusRead = "streaming_status:read",
  
  // Streaming sessions
  StreamingSessionsRead = "streaming_sessions:read",
  StreamingSessionsReadHistory = "streaming_sessions:read_history",

  // PSO dashboard
  PsoDashboardRead = "pso_dashboard:read",

  // Migrations
  MigrationsRun = "migrations:run",

  // WebPubSub connect
  WebPubSubConnect = "webpubsub:connect",

  // Roles / permissions management
  RolesManage = "roles:manage",
  RolesAssign = "roles:assign",
}

