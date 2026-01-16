import { Prisma, FormType as PrismaFormType } from '@prisma/client';
import { CameraFailureStage } from '@prisma/client';
 
export const createMockPrismaClient = (): any => {
  const mockPrismaClient: any = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    cameraStartFailure: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    contactManagerForm: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    apiErrorLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    pendingCommand: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    snapshotReason: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    userRoleAssignment: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    snapshot: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    presence: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
    presenceHistory: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    recordingSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    streamingSessionHistory: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    talkSessionHistory: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    contactManagerProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contactManagerStatusHistory: {
      create: jest.fn(),
    },
    superAdminProfile: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    superAdminAuditLog: {
      create: jest.fn(),
    },
    contactManagerAuditLog: {
      create: jest.fn(),
    },
    chat: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
  
  // Add $transaction after mockPrismaClient is fully defined to avoid circular reference
  mockPrismaClient.$transaction = jest.fn(async (callback: (tx: any) => Promise<any>) => {
    return await callback(mockPrismaClient);
  });
  
  return mockPrismaClient;
};

export const mockDate = new Date('2024-01-01T12:00:00.000Z');

export const mockGetCentralAmericaTime = jest.fn(() => mockDate);

export const createMockAuditLog = (overrides = {}) => ({
  id: 'audit-log-id',
  entity: 'User',
  entityId: 'user-id',
  action: 'CREATE',
  changedById: 'user-id',
  timestamp: mockDate,
  dataBefore: null,
  dataAfter: { name: 'Test' },
  ...overrides,
});

export const createMockCameraStartFailure = (overrides = {}) => ({
  id: 'failure-id',
  userId: 'user-id',
  userAdId: 'user-ad-id',
  userEmail: 'test@example.com',
  stage: CameraFailureStage.Enumerate,
  errorName: 'Error',
  errorMessage: 'Error message',
  deviceCount: 2,
  devicesSnapshot: {},
  attempts: [],
  metadata: {},
  createdAt: mockDate,
  createdAtCentralAmerica: '2024-01-01T12:00:00.000Z',
  ...overrides,
});

export const createMockContactManagerForm = (overrides = {}) => ({
  id: 'form-id',
  formType: PrismaFormType.Disconnections,
  senderId: 'sender-id',
  imageUrl: 'https://example.com/image.jpg',
  data: { field: 'value' },
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides,
});

export const createMockApiErrorLog = (overrides = {}) => ({
  id: 'error-log-id',
  severity: 'High',
  source: 'Database',
  endpoint: '/api/test',
  functionName: 'testFunction',
  errorName: 'Error',
  errorMessage: 'Error message',
  stackTrace: 'stack trace',
  httpStatusCode: 500,
  userId: 'user-id',
  userEmail: 'test@example.com',
  requestId: 'request-id',
  context: {},
  resolved: false,
  resolvedAt: null,
  resolvedBy: null,
  createdAt: mockDate,
  ...overrides,
});

export const createMockPendingCommand = (overrides = {}) => ({
  id: 'command-id',
  employeeId: 'employee-id',
  command: 'COMMAND',
  timestamp: mockDate,
  acknowledged: false,
  published: false,
  reason: null,
  attemptCount: 0,
  createdAt: mockDate,
  updatedAt: mockDate,
  acknowledgedAt: null,
  publishedAt: null,
  ...overrides,
});

export const createMockRole = (overrides = {}) => ({
  id: 'role-id',
  name: 'TestRole',
  displayName: 'Test Role',
  description: 'Test role description',
  isSystem: false,
  isActive: true,
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides,
});

export const createMockPermission = (overrides = {}) => ({
  id: 'permission-id',
  code: 'test:permission',
  name: 'Test Permission',
  resource: 'test',
  action: 'permission',
  isActive: true,
  description: 'Test permission description',
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides,
});

export const createMockSnapshotReason = (overrides = {}) => ({
  id: 'reason-id',
  label: 'Test Reason',
  code: 'TEST_REASON',
  isDefault: false,
  isActive: true,
  order: 1,
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-id',
  azureAdObjectId: 'azure-id',
  email: 'user@example.com',
  fullName: 'User Name',
  role: 'PSO',
  roleChangedAt: null,
  supervisorId: null,
  assignedAt: null,
  createdAt: mockDate,
  updatedAt: mockDate,
  deletedAt: null,
  userRoleAssignments: [],
  supervisor: null,
  ...overrides,
});

export const createMockUserRoleAssignment = (overrides = {}) => ({
  userId: 'user-id',
  roleId: 'role-id',
  assignedAt: mockDate,
  isActive: true,
  role: createMockRole(),
  ...overrides,
});

export const createMockSnapshot = (overrides = {}) => ({
  id: 'snapshot-id',
  supervisorId: 'supervisor-id',
  psoId: 'pso-id',
  reasonId: 'reason-id',
  description: 'Test description',
  takenAt: mockDate,
  imageUrl: 'https://example.com/image.jpg',
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides,
});

export const createMockPresence = (overrides = {}) => ({
  id: 'presence-id',
  userId: 'user-id',
  status: 'Online',
  lastSeenAt: mockDate,
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides,
});

export const createMockPresenceHistory = (overrides = {}) => ({
  id: 'presence-history-id',
  userId: 'user-id',
  status: 'Online',
  startedAt: mockDate,
  endedAt: null,
  createdAt: mockDate,
  updatedAt: mockDate,
  ...overrides,
});
