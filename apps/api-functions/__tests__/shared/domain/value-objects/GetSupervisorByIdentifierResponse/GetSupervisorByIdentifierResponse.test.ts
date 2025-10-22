import { GetSupervisorByIdentifierResponse } from '../../../../../shared/domain/value-objects/GetSupervisorByIdentifierResponse';

describe('GetSupervisorByIdentifierResponse', () => {
  describe('constructor', () => {
    it('should create response with supervisor data', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBeUndefined();
    });

    it('should create response with message only', () => {
      const message = 'No supervisor found';
      const response = new GetSupervisorByIdentifierResponse(undefined, message);

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBe(message);
    });

    it('should create response with both supervisor and message', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const message = 'Supervisor found';
      const response = new GetSupervisorByIdentifierResponse(supervisor, message);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBe(message);
    });

    it('should create response with no parameters', () => {
      const response = new GetSupervisorByIdentifierResponse();

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBeUndefined();
    });
  });

  describe('withSupervisor factory method', () => {
    it('should create response with supervisor data', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorByIdentifierResponse.withSupervisor(supervisor);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBeUndefined();
    });

    it('should create response with different supervisor data', () => {
      const supervisor1 = {
        id: 'supervisor-1',
        azureAdObjectId: 'azure-obj-1',
        email: 'supervisor1@example.com',
        fullName: 'Jane Smith'
      };
      const supervisor2 = {
        id: 'supervisor-2',
        azureAdObjectId: 'azure-obj-2',
        email: 'supervisor2@example.com',
        fullName: 'Bob Johnson'
      };

      const response1 = GetSupervisorByIdentifierResponse.withSupervisor(supervisor1);
      const response2 = GetSupervisorByIdentifierResponse.withSupervisor(supervisor2);

      expect(response1.supervisor).toBe(supervisor1);
      expect(response2.supervisor).toBe(supervisor2);
    });
  });

  describe('withMessage factory method', () => {
    it('should create response with message', () => {
      const message = 'No supervisor found';
      const response = GetSupervisorByIdentifierResponse.withMessage(message);

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBe(message);
    });

    it('should create response with different messages', () => {
      const message1 = 'No supervisor found';
      const message2 = 'Supervisor not assigned';
      const message3 = 'Invalid identifier';

      const response1 = GetSupervisorByIdentifierResponse.withMessage(message1);
      const response2 = GetSupervisorByIdentifierResponse.withMessage(message2);
      const response3 = GetSupervisorByIdentifierResponse.withMessage(message3);

      expect(response1.message).toBe(message1);
      expect(response2.message).toBe(message2);
      expect(response3.message).toBe(message3);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with supervisor', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should convert to payload format with message', () => {
      const message = 'No supervisor found';
      const response = new GetSupervisorByIdentifierResponse(undefined, message);
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: message
      });
    });

    it('should convert to payload format with both supervisor and message', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const message = 'Supervisor found';
      const response = new GetSupervisorByIdentifierResponse(supervisor, message);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should convert to payload format with no parameters', () => {
      const response = new GetSupervisorByIdentifierResponse();
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: undefined
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).supervisor = null;
      }).toThrow();

      expect(() => {
        (response as any).message = 'modified';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle supervisor with different data formats', () => {
      const supervisor1 = {
        id: 'supervisor-1',
        azureAdObjectId: 'azure-obj-1',
        email: 'supervisor1@example.com',
        fullName: 'John Doe'
      };
      const supervisor2 = {
        id: 'supervisor-2',
        azureAdObjectId: 'azure-obj-2',
        email: 'supervisor2@company.com',
        fullName: 'Jane Smith'
      };

      const response1 = new GetSupervisorByIdentifierResponse(supervisor1);
      const response2 = new GetSupervisorByIdentifierResponse(supervisor2);

      expect(response1.supervisor?.email).toBe('supervisor1@example.com');
      expect(response2.supervisor?.email).toBe('supervisor2@company.com');
    });

    it('should handle supervisor with special characters in data', () => {
      const supervisor = {
        id: 'supervisor-123!@#$%^&*()',
        azureAdObjectId: 'azure-obj-123!@#$%^&*()',
        email: 'supervisor+test@example.com',
        fullName: 'José María'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);

      expect(response.supervisor?.id).toBe('supervisor-123!@#$%^&*()');
      expect(response.supervisor?.azureAdObjectId).toBe('azure-obj-123!@#$%^&*()');
      expect(response.supervisor?.email).toBe('supervisor+test@example.com');
      expect(response.supervisor?.fullName).toBe('José María');
    });

    it('should handle supervisor with unicode characters', () => {
      const supervisor = {
        id: 'supervisor-123-émojis-🚀',
        azureAdObjectId: 'azure-obj-123-émojis-🚀',
        email: 'supervisor-émojis-🚀@example.com',
        fullName: 'Supervisor émojis 🚀'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);

      expect(response.supervisor?.id).toBe('supervisor-123-émojis-🚀');
      expect(response.supervisor?.azureAdObjectId).toBe('azure-obj-123-émojis-🚀');
      expect(response.supervisor?.email).toBe('supervisor-émojis-🚀@example.com');
      expect(response.supervisor?.fullName).toBe('Supervisor émojis 🚀');
    });

    it('should handle supervisor with long data fields', () => {
      const longId = 'supervisor-' + 'a'.repeat(1000);
      const longEmail = 'supervisor-' + 'a'.repeat(1000) + '@example.com';
      const longName = 'Supervisor ' + 'a'.repeat(1000);
      const supervisor = {
        id: longId,
        azureAdObjectId: 'azure-obj-123',
        email: longEmail,
        fullName: longName
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);

      expect(response.supervisor?.id).toBe(longId);
      expect(response.supervisor?.email).toBe(longEmail);
      expect(response.supervisor?.fullName).toBe(longName);
    });

    it('should handle message with special characters', () => {
      const message = 'No supervisor found!@#$%^&*()';
      const response = new GetSupervisorByIdentifierResponse(undefined, message);

      expect(response.message).toBe(message);
    });

    it('should handle message with unicode characters', () => {
      const message = 'No supervisor found émojis 🚀';
      const response = new GetSupervisorByIdentifierResponse(undefined, message);

      expect(response.message).toBe(message);
    });

    it('should handle message with newlines', () => {
      const message = 'No supervisor found\nPlease try again';
      const response = new GetSupervisorByIdentifierResponse(undefined, message);

      expect(response.message).toBe(message);
    });

    it('should handle empty message', () => {
      const response = new GetSupervisorByIdentifierResponse(undefined, '');

      expect(response.message).toBe('');
    });

    it('should handle long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new GetSupervisorByIdentifierResponse(undefined, longMessage);

      expect(response.message).toBe(longMessage);
    });
  });

  describe('type safety', () => {
    it('should accept supervisor object with required properties', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);

      expect(response.supervisor).toHaveProperty('id');
      expect(response.supervisor).toHaveProperty('azureAdObjectId');
      expect(response.supervisor).toHaveProperty('email');
      expect(response.supervisor).toHaveProperty('fullName');
      expect(typeof response.supervisor?.id).toBe('string');
      expect(typeof response.supervisor?.azureAdObjectId).toBe('string');
      expect(typeof response.supervisor?.email).toBe('string');
      expect(typeof response.supervisor?.fullName).toBe('string');
    });

    it('should accept string for message', () => {
      const message = 'No supervisor found';
      const response = new GetSupervisorByIdentifierResponse(undefined, message);

      expect(typeof response.message).toBe('string');
    });

    it('should return object from toPayload', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = new GetSupervisorByIdentifierResponse(supervisor);
      const payload = response.toPayload();

      expect(typeof payload).toBe('object');
      expect(payload).toHaveProperty('supervisor');
    });
  });

  describe('validation scenarios', () => {
    it('should handle supervisor found scenario', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorByIdentifierResponse.withSupervisor(supervisor);
      const payload = response.toPayload();

      expect(payload.supervisor).toBe(supervisor);
      expect(payload.message).toBeUndefined();
    });

    it('should handle supervisor not found scenario', () => {
      const message = 'No supervisor found for the given identifier';
      const response = GetSupervisorByIdentifierResponse.withMessage(message);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBe(message);
    });

    it('should handle supervisor not assigned scenario', () => {
      const message = 'Supervisor not assigned to this PSO';
      const response = GetSupervisorByIdentifierResponse.withMessage(message);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBe(message);
    });

    it('should handle invalid identifier scenario', () => {
      const message = 'Invalid identifier provided';
      const response = GetSupervisorByIdentifierResponse.withMessage(message);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBe(message);
    });

    it('should handle supervisor with different email domains scenario', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@company.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorByIdentifierResponse.withSupervisor(supervisor);

      expect(response.supervisor?.email).toBe('supervisor@company.com');
    });

    it('should handle supervisor with subdomain email scenario', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@subdomain.example.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorByIdentifierResponse.withSupervisor(supervisor);

      expect(response.supervisor?.email).toBe('supervisor@subdomain.example.com');
    });

    it('should handle supervisor with different Azure AD Object ID formats scenario', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorByIdentifierResponse.withSupervisor(supervisor);

      expect(response.supervisor?.azureAdObjectId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });

    it('should handle supervisor with different full name formats scenario', () => {
      const supervisor1 = {
        id: 'supervisor-1',
        azureAdObjectId: 'azure-obj-1',
        email: 'supervisor1@example.com',
        fullName: 'John Doe'
      };
      const supervisor2 = {
        id: 'supervisor-2',
        azureAdObjectId: 'azure-obj-2',
        email: 'supervisor2@example.com',
        fullName: 'Dr. Jane Smith'
      };
      const supervisor3 = {
        id: 'supervisor-3',
        azureAdObjectId: 'azure-obj-3',
        email: 'supervisor3@example.com',
        fullName: 'José María'
      };

      const response1 = GetSupervisorByIdentifierResponse.withSupervisor(supervisor1);
      const response2 = GetSupervisorByIdentifierResponse.withSupervisor(supervisor2);
      const response3 = GetSupervisorByIdentifierResponse.withSupervisor(supervisor3);

      expect(response1.supervisor?.fullName).toBe('John Doe');
      expect(response2.supervisor?.fullName).toBe('Dr. Jane Smith');
      expect(response3.supervisor?.fullName).toBe('José María');
    });
  });
});
