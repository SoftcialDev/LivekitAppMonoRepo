import { GetSupervisorByIdentifierResponse } from '../../../src/domain/value-objects/GetSupervisorByIdentifierResponse';

describe('GetSupervisorByIdentifierResponse', () => {
  describe('toPayload', () => {
    it('should return supervisor when supervisor is present', () => {
      const supervisor = {
        id: 'supervisor-id',
        azureAdObjectId: 'azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should return message when supervisor is not present', () => {
      const response = new GetSupervisorByIdentifierResponse(undefined, 'No supervisor found');
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'No supervisor found'
      });
    });
  });
});






