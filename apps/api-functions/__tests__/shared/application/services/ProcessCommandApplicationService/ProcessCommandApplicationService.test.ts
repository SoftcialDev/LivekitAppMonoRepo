/**
 * @fileoverview ProcessCommandApplicationService - unit tests
 */

import { ProcessCommandApplicationService } from '../../../../../shared/application/services/ProcessCommandApplicationService';

describe('ProcessCommandApplicationService', () => {
  it('delegates processCommand to domain service and returns response', async () => {
    const domain = { processCommand: jest.fn().mockResolvedValue({ ok: true }) };
    const svc = new ProcessCommandApplicationService(domain as any);
    const req = { commandId: 'c1' } as any;
    const result = await svc.processCommand(req);
    expect(domain.processCommand).toHaveBeenCalledWith(req);
    expect(result).toEqual({ ok: true });
  });
});


