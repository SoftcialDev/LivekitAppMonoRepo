import { GetActiveTalkSessionResponse } from '../../../src/domain/value-objects/GetActiveTalkSessionResponse';

describe('GetActiveTalkSessionResponse', () => {
  describe('toPayload', () => {
    it('should convert response with active session to payload format', () => {
      const response = new GetActiveTalkSessionResponse(
        true,
        'session-id',
        'supervisor@example.com',
        'Supervisor Name',
        '2024-01-01T10:00:00Z'
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        hasActiveSession: true,
        sessionId: 'session-id',
        supervisorEmail: 'supervisor@example.com',
        supervisorName: 'Supervisor Name',
        startedAt: '2024-01-01T10:00:00Z'
      });
    });

    it('should convert response without active session to payload format', () => {
      const response = new GetActiveTalkSessionResponse(false);
      const payload = response.toPayload();

      expect(payload).toEqual({
        hasActiveSession: false,
        sessionId: undefined,
        supervisorEmail: undefined,
        supervisorName: undefined,
        startedAt: undefined
      });
    });
  });
});


