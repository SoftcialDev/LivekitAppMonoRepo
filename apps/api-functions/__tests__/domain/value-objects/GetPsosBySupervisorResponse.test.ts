import { GetPsosBySupervisorResponse } from '../../../src/domain/value-objects/GetPsosBySupervisorResponse';

describe('GetPsosBySupervisorResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const psos = [
        { email: 'pso1@example.com', supervisorName: 'Supervisor 1' },
        { email: 'pso2@example.com', supervisorName: 'Supervisor 1' }
      ];
      const response = new GetPsosBySupervisorResponse(psos);
      const payload = response.toPayload();

      expect(payload).toEqual({
        psos: psos
      });
    });

    it('should handle empty psos array', () => {
      const response = new GetPsosBySupervisorResponse([]);
      const payload = response.toPayload();

      expect(payload.psos).toEqual([]);
    });
  });
});


