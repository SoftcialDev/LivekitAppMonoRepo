/**
 * @fileoverview LivekitRecordingFunction handler - unit tests
 * @summary Unit tests for LivekitRecordingFunction Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../LivekitRecordingFunction/index')).default;
  return handler(ctx, req);
}

describe('LivekitRecordingFunction handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'POST' as any });
    (req as any).body = {
      command: 'START',
      roomName: 'test-room-123',
      reason: 'Test recording'
    };
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { processRecordingCommand: jest.fn() };
    container = createServiceContainerMock({ LivekitRecordingApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should process START recording command successfully and return 200', async () => {
    const mockResponse = {
      command: 'START',
      roomName: 'test-room-123',
      status: 'success',
      message: 'Recording started successfully'
    };
    appService.processRecordingCommand.mockResolvedValue(toPayloadify(mockResponse));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('LivekitRecordingApplicationService');
    expect(appService.processRecordingCommand).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({
        command: 'START',
        roomName: 'test-room-123'
      })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });

  it('should process STOP recording command successfully and return 200', async () => {
    (req as any).body = {
      command: 'STOP',
      roomName: 'test-room-456',
      reason: 'End recording'
    };
    const mockResponse = {
      command: 'STOP',
      roomName: 'test-room-456',
      status: 'success',
      message: 'Recording stopped successfully'
    };
    appService.processRecordingCommand.mockResolvedValue(toPayloadify(mockResponse));

    await runHandler(ctx, req);

    expect(appService.processRecordingCommand).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({
        command: 'STOP',
        roomName: 'test-room-456'
      })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.processRecordingCommand.mockRejectedValue(new Error('Recording command failed'));

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to process recording command' });
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to process recording command' });
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to process recording command' });
  });

  it('should handle empty response gracefully', async () => {
    appService.processRecordingCommand.mockResolvedValue(toPayloadify(null));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: null
    });
  });

  it('should handle undefined response gracefully', async () => {
    appService.processRecordingCommand.mockResolvedValue(toPayloadify(undefined));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    });
  });

  it('should process recording command with different room names', async () => {
    (req as any).body = {
      command: 'START',
      roomName: 'different-room-789',
      reason: 'Different room recording'
    };
    const mockResponse = {
      command: 'START',
      roomName: 'different-room-789',
      status: 'success',
      message: 'Recording started for different room'
    };
    appService.processRecordingCommand.mockResolvedValue(toPayloadify(mockResponse));

    await runHandler(ctx, req);

    expect(appService.processRecordingCommand).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({
        command: 'START',
        roomName: 'different-room-789'
      })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });
});
