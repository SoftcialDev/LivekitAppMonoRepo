import { Context, HttpRequest } from '@azure/functions';
import { DeleteSnapshotReasonApplicationService } from '../../src/application/services/DeleteSnapshotReasonApplicationService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    snapshotReason: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('DeleteSnapshotReason handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<DeleteSnapshotReasonApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'DELETE',
      body: {
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: mockRequest.body,
    };

    mockApplicationService = {
      deleteSnapshotReason: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully delete snapshot reason', async () => {
    const prisma = require('../../src/infrastructure/database/PrismaClientService').default;
    prisma.snapshotReason.findUnique.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      label: 'Test Reason',
      code: 'TEST_REASON',
      isDefault: false,
      isActive: true,
    });
    prisma.snapshotReason.update.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      label: 'Test Reason',
      code: 'TEST_REASON',
      isDefault: false,
      isActive: false,
    });

    mockApplicationService.deleteSnapshotReason.mockResolvedValue(undefined);

    const deleteSnapshotReasonHandler = (await import('../../src/handlers/DeleteSnapshotReason')).default;
    await deleteSnapshotReasonHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('DeleteSnapshotReasonApplicationService');
    expect(mockApplicationService.deleteSnapshotReason).toHaveBeenCalledWith(
      'test-azure-ad-id',
      '550e8400-e29b-41d4-a716-446655440000'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      message: 'Snapshot reason deleted successfully',
    });
  });
});

