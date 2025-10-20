/**
 * @fileoverview StreamingSessionUpdateApplicationService - unit tests
 */

import { StreamingSessionUpdateApplicationService } from '../../../../../shared/application/services/StreamingSessionUpdateApplicationService';

describe('StreamingSessionUpdateApplicationService', () => {
  it('delegates updateStreamingSession to domain service and returns response', async () => {
    const domain = { updateStreamingSession: jest.fn().mockResolvedValue({ ok: true }) };
    const auth = {} as any;
    const svc = new StreamingSessionUpdateApplicationService(domain as any, auth);
    const req = { sessionId: 's1' } as any;
    const result = await svc.updateStreamingSession('caller', req);
    expect(domain.updateStreamingSession).toHaveBeenCalledWith(req);
    expect(result).toEqual({ ok: true });
  });
});


