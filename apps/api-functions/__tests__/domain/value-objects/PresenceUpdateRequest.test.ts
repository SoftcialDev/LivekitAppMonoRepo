import { PresenceUpdateRequest } from '../../../src/domain/value-objects/PresenceUpdateRequest';
import { Status } from '../../../src/domain/enums/Status';

describe('PresenceUpdateRequest', () => {
  describe('toPayload', () => {
    it('should convert request to payload format', () => {
      const request = new PresenceUpdateRequest('caller-id', Status.Online);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-id',
        status: Status.Online
      });
    });
  });
});

