/**
 * @fileoverview SendSnapshotApplicationService - unit tests
 */

import { SendSnapshotApplicationService } from '../../../../../shared/application/services/SendSnapshotApplicationService';

describe('SendSnapshotApplicationService', () => {
  it('authorizes and delegates sendSnapshot to domain service', async () => {
    const domain = { sendSnapshot: jest.fn().mockResolvedValue({ payload: true }) };
    const auth = { authorizeUserWithRoles: jest.fn().mockResolvedValue(undefined) } as any;
    const svc = new SendSnapshotApplicationService(domain as any, auth);
    const req = { psoEmail: 'pso@example.com' } as any;
    const result = await svc.sendSnapshot('caller', req, 'Supervisor Name', 'token');
    expect(auth.authorizeUserWithRoles).toHaveBeenCalled();
    expect(domain.sendSnapshot).toHaveBeenCalledWith(req, 'Supervisor Name', 'token');
    expect(result).toEqual({ payload: true });
  });
});


