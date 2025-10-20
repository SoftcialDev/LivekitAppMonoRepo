/**
 * @fileoverview PresenceUpdateApplicationService - unit tests
 */

import { PresenceUpdateApplicationService } from '../../../../../shared/application/services/PresenceUpdateApplicationService';
import { Status } from '../../../../../shared/domain/enums/Status';

describe('PresenceUpdateApplicationService', () => {
  it('calls setUserOnline and returns online response', async () => {
    const domain = { setUserOnline: jest.fn().mockResolvedValue(undefined), setUserOffline: jest.fn() };
    const auth = {} as any;
    const svc = new PresenceUpdateApplicationService(domain as any, auth);
    const result = await svc.updatePresence('caller', { status: Status.Online } as any);
    expect(domain.setUserOnline).toHaveBeenCalledWith('caller');
    expect(result).toEqual({ message: 'Presence set to online' });
  });

  it('calls setUserOffline and returns offline response', async () => {
    const domain = { setUserOnline: jest.fn(), setUserOffline: jest.fn().mockResolvedValue(undefined) };
    const auth = {} as any;
    const svc = new PresenceUpdateApplicationService(domain as any, auth);
    const result = await svc.updatePresence('caller', { status: Status.Offline } as any);
    expect(domain.setUserOffline).toHaveBeenCalledWith('caller');
    expect(result).toEqual({ message: 'Presence set to offline' });
  });
});


