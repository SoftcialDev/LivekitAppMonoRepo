/**
 * @fileoverview ProcessCommand handler - unit tests
 * @summary Unit tests for ProcessCommand Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, message: unknown) {
  const handler = (await import('../../../ProcessCommand/index')).default;
  return handler(ctx, message);
}

describe('ProcessCommand handler - unit', () => {
  let ctx: Context;
  let message: unknown;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    message = {
      employeeEmail: 'employee@test.com',
      command: 'START',
      timestamp: '2024-01-01T00:00:00.000Z',
      reason: 'Test command'
    };

    appService = { processCommand: jest.fn() };
    container = createServiceContainerMock({ ProcessCommandApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should process command and log success', async () => {
    const payload = {
      commandId: 'cmd-123',
      delivered: true,
      message: 'Command START for employee@test.com processed successfully'
    };
    appService.processCommand.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, message);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('ProcessCommandApplicationService');
    expect(appService.processCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeEmail: 'employee@test.com',
        command: 'START',
        timestamp: expect.any(Date),
        reason: 'Test command'
      })
    );
    expect(ctx.log.info).toHaveBeenCalledWith(
      'Command START for employee@test.com processed (id=cmd-123); delivered=true'
    );
  });

  it('should handle STOP command', async () => {
    message = {
      employeeEmail: 'employee@test.com',
      command: 'STOP',
      timestamp: '2024-01-01T00:00:00.000Z',
      reason: 'Manual stop'
    };
    const payload = {
      commandId: 'cmd-456',
      delivered: false,
      message: 'Command STOP for employee@test.com processed successfully'
    };
    appService.processCommand.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, message);

    expect(appService.processCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeEmail: 'employee@test.com',
        command: 'STOP',
        timestamp: expect.any(Date),
        reason: 'Manual stop'
      })
    );
    expect(ctx.log.info).toHaveBeenCalledWith(
      'Command STOP for employee@test.com processed (id=cmd-456); delivered=false'
    );
  });

  it('should handle command without reason', async () => {
    message = {
      employeeEmail: 'employee@test.com',
      command: 'START',
      timestamp: '2024-01-01T00:00:00.000Z'
    };
    const payload = {
      commandId: 'cmd-789',
      delivered: true,
      message: 'Command START for employee@test.com processed successfully'
    };
    appService.processCommand.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, message);

    expect(appService.processCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeEmail: 'employee@test.com',
        command: 'START',
        timestamp: expect.any(Date),
        reason: undefined
      })
    );
  });

  it('should throw error when application service fails', async () => {
    const error = new Error('Application service failed');
    appService.processCommand.mockRejectedValue(error);

    await expect(runHandler(ctx, message)).rejects.toThrow('Application service failed');
    expect(ctx.log.error).toHaveBeenCalledWith('Error in ProcessCommand:', error);
  });

  it('should throw error when initialize fails', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await expect(runHandler(ctx, message)).rejects.toThrow('init failed');
    expect(ctx.log.error).toHaveBeenCalledWith('Error in ProcessCommand:', expect.any(Error));
  });

  it('should throw error when resolve fails', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await expect(runHandler(ctx, message)).rejects.toThrow('resolve failed');
    expect(ctx.log.error).toHaveBeenCalledWith('Error in ProcessCommand:', expect.any(Error));
  });
});
