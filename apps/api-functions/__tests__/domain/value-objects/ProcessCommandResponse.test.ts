import { ProcessCommandResponse } from '../../../src/domain/value-objects/ProcessCommandResponse';

describe('ProcessCommandResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format with delivered true', () => {
      const response = new ProcessCommandResponse('command-id', true, 'Command processed');
      const payload = response.toPayload();

      expect(payload).toEqual({
        commandId: 'command-id',
        delivered: true,
        message: 'Command processed'
      });
    });

    it('should convert response to payload format with delivered false', () => {
      const response = new ProcessCommandResponse('command-id', false, 'Command queued');
      const payload = response.toPayload();

      expect(payload).toEqual({
        commandId: 'command-id',
        delivered: false,
        message: 'Command queued'
      });
    });
  });
});


