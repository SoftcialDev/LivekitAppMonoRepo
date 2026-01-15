import { Presence } from '../../../src/domain/entities/Presence';
import { Status } from '../../../src/domain/enums/Status';

describe('Presence', () => {
  describe('toPayload', () => {
    it('should convert presence to payload format', () => {
      const lastSeenAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-01T11:00:00Z');
      const presence = new Presence('user-id', Status.Online, lastSeenAt, updatedAt);
      const payload = presence.toPayload();

      expect(payload).toEqual({
        userId: 'user-id',
        status: Status.Online,
        lastSeenAt: lastSeenAt,
        updatedAt: updatedAt
      });
    });
  });
});

