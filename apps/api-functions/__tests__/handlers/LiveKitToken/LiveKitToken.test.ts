/**
 * @fileoverview LiveKitToken handler - unit tests
 * @summary Unit tests for LiveKitToken Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../LiveKitToken/index')).default;
  return handler(ctx, req);
}

describe('LiveKitToken handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'GET' as any });
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { generateToken: jest.fn() };
    container = createServiceContainerMock({ LiveKitTokenApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should generate LiveKit token successfully and return 200', async () => {
    const mockResponse = {
      rooms: [
        { room: 'room-123', token: 'token-123' },
        { room: 'room-456', token: 'token-456' }
      ],
      livekitUrl: 'wss://test.livekit.cloud'
    };
    appService.generateToken.mockResolvedValue(toPayloadify(mockResponse));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('LiveKitTokenApplicationService');
    expect(appService.generateToken).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({
        callerId: ctx.bindings.callerId
      })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });


  it('should return 500 when application service throws', async () => {
    appService.generateToken.mockRejectedValue(new Error('Token generation failed'));

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to generate LiveKit token' });
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to generate LiveKit token' });
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to generate LiveKit token' });
  });

  it('should handle empty response gracefully', async () => {
    appService.generateToken.mockResolvedValue(toPayloadify(null));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: null
    });
  });

  it('should handle undefined response gracefully', async () => {
    appService.generateToken.mockResolvedValue(toPayloadify(undefined));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    });
  });
});
