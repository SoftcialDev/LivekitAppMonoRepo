/**
 * @fileoverview LiveKitTokenApplicationService - unit tests
 */

import { LiveKitTokenApplicationService } from '../../../../../shared/application/services/LiveKitTokenApplicationService';

describe('LiveKitTokenApplicationService', () => {
  it('delegates generateToken to domain service and returns response', async () => {
    const domain = { generateTokenForUser: jest.fn().mockResolvedValue({ token: 'abc' }) };
    const auth = {} as any;
    const svc = new LiveKitTokenApplicationService(domain as any, auth);
    const req = { roomName: 'r1' } as any;
    const result = await svc.generateToken('caller', req);
    expect(domain.generateTokenForUser).toHaveBeenCalledWith(req);
    expect(result).toEqual({ token: 'abc' });
  });
});


