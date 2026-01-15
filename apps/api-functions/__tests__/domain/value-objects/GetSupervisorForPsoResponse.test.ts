import { GetSupervisorForPsoResponse } from '../../../src/domain/value-objects/GetSupervisorForPsoResponse';

describe('GetSupervisorForPsoResponse', () => {
  describe('toPayload', () => {
    it('should return supervisor when supervisor is present', () => {
      const supervisor = {
        id: 'supervisor-id',
        azureAdObjectId: 'azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      };
      const response = new GetSupervisorForPsoResponse(supervisor);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should return message when message is present and no supervisor', () => {
      const response = new GetSupervisorForPsoResponse(undefined, 'No supervisor assigned');
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'No supervisor assigned'
      });
    });

    it('should return error when error is present and no supervisor or message', () => {
      const response = new GetSupervisorForPsoResponse(undefined, undefined, 'Error occurred');
      const payload = response.toPayload();

      expect(payload).toEqual({
        error: 'Error occurred'
      });
    });

    it('should return empty object when nothing is present', () => {
      const response = new GetSupervisorForPsoResponse();
      const payload = response.toPayload();

      expect(payload).toEqual({});
    });
  });
});


