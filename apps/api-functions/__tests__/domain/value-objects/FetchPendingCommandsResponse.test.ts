import { FetchPendingCommandsResponse } from '../../../src/domain/value-objects/FetchPendingCommandsResponse';
import { PendingCommand } from '../../../src/domain/entities/PendingCommand';

describe('FetchPendingCommandsResponse', () => {
  describe('toPayload', () => {
    it('should convert response with pending command to payload format', () => {
      const mockPendingCommand = { id: 'command-id' } as PendingCommand;
      const response = new FetchPendingCommandsResponse(mockPendingCommand);
      const payload = response.toPayload();

      expect(payload).toEqual({
        pending: mockPendingCommand
      });
    });

    it('should convert response with null pending to payload format', () => {
      const response = new FetchPendingCommandsResponse(null);
      const payload = response.toPayload();

      expect(payload).toEqual({
        pending: null
      });
    });
  });
});

