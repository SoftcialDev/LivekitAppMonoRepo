import { GetSupervisorForPsoResponse } from '../../../../../shared/domain/value-objects/GetSupervisorForPsoResponse';

describe('GetSupervisorForPsoResponse', () => {
  describe('constructor', () => {
    it('should create response with supervisor data', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = new GetSupervisorForPsoResponse(supervisor);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBeUndefined();
      expect(response.error).toBeUndefined();
    });

    it('should create response with message only', () => {
      const message = 'No supervisor found';
      const response = new GetSupervisorForPsoResponse(undefined, message);

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBe(message);
      expect(response.error).toBeUndefined();
    });

    it('should create response with error only', () => {
      const error = 'Database connection failed';
      const response = new GetSupervisorForPsoResponse(undefined, undefined, error);

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBeUndefined();
      expect(response.error).toBe(error);
    });

    it('should create response with supervisor and message', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const message = 'Supervisor found';
      const response = new GetSupervisorForPsoResponse(supervisor, message);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBe(message);
      expect(response.error).toBeUndefined();
    });

    it('should create response with supervisor and error', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const error = 'Partial data retrieved';
      const response = new GetSupervisorForPsoResponse(supervisor, undefined, error);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBeUndefined();
      expect(response.error).toBe(error);
    });

    it('should create response with message and error', () => {
      const message = 'No supervisor found';
      const error = 'Database connection failed';
      const response = new GetSupervisorForPsoResponse(undefined, message, error);

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBe(message);
      expect(response.error).toBe(error);
    });

    it('should create response with all parameters', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const message = 'Supervisor found';
      const error = 'Warning: Partial data';
      const response = new GetSupervisorForPsoResponse(supervisor, message, error);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBe(message);
      expect(response.error).toBe(error);
    });

    it('should create response with no parameters', () => {
      const response = new GetSupervisorForPsoResponse();

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBeUndefined();
      expect(response.error).toBeUndefined();
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
      const response = GetSupervisorForPsoResponse.withSupervisor(supervisor);

      expect(response.supervisor).toBe(supervisor);
      expect(response.message).toBeUndefined();
      expect(response.error).toBeUndefined();
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

      const response1 = GetSupervisorForPsoResponse.withSupervisor(supervisor1);
      const response2 = GetSupervisorForPsoResponse.withSupervisor(supervisor2);

      expect(response1.supervisor).toBe(supervisor1);
      expect(response2.supervisor).toBe(supervisor2);
    });
  });

  describe('withMessage factory method', () => {
    it('should create response with message', () => {
      const message = 'No supervisor found';
      const response = GetSupervisorForPsoResponse.withMessage(message);

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBe(message);
      expect(response.error).toBeUndefined();
    });

    it('should create response with different messages', () => {
      const message1 = 'No supervisor found';
      const message2 = 'Supervisor not assigned';
      const message3 = 'Invalid PSO identifier';

      const response1 = GetSupervisorForPsoResponse.withMessage(message1);
      const response2 = GetSupervisorForPsoResponse.withMessage(message2);
      const response3 = GetSupervisorForPsoResponse.withMessage(message3);

      expect(response1.message).toBe(message1);
      expect(response2.message).toBe(message2);
      expect(response3.message).toBe(message3);
    });
  });

  describe('withError factory method', () => {
    it('should create response with error', () => {
      const error = 'Database connection failed';
      const response = GetSupervisorForPsoResponse.withError(error);

      expect(response.supervisor).toBeUndefined();
      expect(response.message).toBeUndefined();
      expect(response.error).toBe(error);
    });

    it('should create response with different errors', () => {
      const error1 = 'Database connection failed';
      const error2 = 'Invalid PSO identifier';
      const error3 = 'Permission denied';

      const response1 = GetSupervisorForPsoResponse.withError(error1);
      const response2 = GetSupervisorForPsoResponse.withError(error2);
      const response3 = GetSupervisorForPsoResponse.withError(error3);

      expect(response1.error).toBe(error1);
      expect(response2.error).toBe(error2);
      expect(response3.error).toBe(error3);
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
      const response = new GetSupervisorForPsoResponse(supervisor);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should convert to payload format with message', () => {
      const message = 'No supervisor found';
      const response = new GetSupervisorForPsoResponse(undefined, message);
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: message
      });
    });

    it('should convert to payload format with error', () => {
      const error = 'Database connection failed';
      const response = new GetSupervisorForPsoResponse(undefined, undefined, error);
      const payload = response.toPayload();

      expect(payload).toEqual({
        error: error
      });
    });

    it('should convert to payload format with supervisor and message (prioritizes supervisor)', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const message = 'Supervisor found';
      const response = new GetSupervisorForPsoResponse(supervisor, message);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should convert to payload format with supervisor and error (prioritizes supervisor)', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const error = 'Partial data retrieved';
      const response = new GetSupervisorForPsoResponse(supervisor, undefined, error);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should convert to payload format with message and error (prioritizes message)', () => {
      const message = 'No supervisor found';
      const error = 'Database connection failed';
      const response = new GetSupervisorForPsoResponse(undefined, message, error);
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: message
      });
    });

    it('should convert to payload format with all parameters (prioritizes supervisor)', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const message = 'Supervisor found';
      const error = 'Warning: Partial data';
      const response = new GetSupervisorForPsoResponse(supervisor, message, error);
      const payload = response.toPayload();

      expect(payload).toEqual({
        supervisor: supervisor
      });
    });

    it('should convert to payload format with no parameters', () => {
      const response = new GetSupervisorForPsoResponse();
      const payload = response.toPayload();

      expect(payload).toEqual({});
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
      const response = new GetSupervisorForPsoResponse(supervisor);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).supervisor = null;
      }).toThrow();

      expect(() => {
        (response as any).message = 'modified';
      }).toThrow();

      expect(() => {
        (response as any).error = 'modified';
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

      const response1 = new GetSupervisorForPsoResponse(supervisor1);
      const response2 = new GetSupervisorForPsoResponse(supervisor2);

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
      const response = new GetSupervisorForPsoResponse(supervisor);

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
      const response = new GetSupervisorForPsoResponse(supervisor);

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
      const response = new GetSupervisorForPsoResponse(supervisor);

      expect(response.supervisor?.id).toBe(longId);
      expect(response.supervisor?.email).toBe(longEmail);
      expect(response.supervisor?.fullName).toBe(longName);
    });

    it('should handle message with special characters', () => {
      const message = 'No supervisor found!@#$%^&*()';
      const response = new GetSupervisorForPsoResponse(undefined, message);

      expect(response.message).toBe(message);
    });

    it('should handle message with unicode characters', () => {
      const message = 'No supervisor found émojis 🚀';
      const response = new GetSupervisorForPsoResponse(undefined, message);

      expect(response.message).toBe(message);
    });

    it('should handle message with newlines', () => {
      const message = 'No supervisor found\nPlease try again';
      const response = new GetSupervisorForPsoResponse(undefined, message);

      expect(response.message).toBe(message);
    });

    it('should handle error with special characters', () => {
      const error = 'Database connection failed!@#$%^&*()';
      const response = new GetSupervisorForPsoResponse(undefined, undefined, error);

      expect(response.error).toBe(error);
    });

    it('should handle error with unicode characters', () => {
      const error = 'Database connection failed émojis 🚀';
      const response = new GetSupervisorForPsoResponse(undefined, undefined, error);

      expect(response.error).toBe(error);
    });

    it('should handle error with newlines', () => {
      const error = 'Database connection failed\nPlease try again';
      const response = new GetSupervisorForPsoResponse(undefined, undefined, error);

      expect(response.error).toBe(error);
    });

    it('should handle empty message', () => {
      const response = new GetSupervisorForPsoResponse(undefined, '');

      expect(response.message).toBe('');
    });

    it('should handle empty error', () => {
      const response = new GetSupervisorForPsoResponse(undefined, undefined, '');

      expect(response.error).toBe('');
    });

    it('should handle long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new GetSupervisorForPsoResponse(undefined, longMessage);

      expect(response.message).toBe(longMessage);
    });

    it('should handle long error', () => {
      const longError = 'a'.repeat(10000);
      const response = new GetSupervisorForPsoResponse(undefined, undefined, longError);

      expect(response.error).toBe(longError);
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
      const response = new GetSupervisorForPsoResponse(supervisor);

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
      const response = new GetSupervisorForPsoResponse(undefined, message);

      expect(typeof response.message).toBe('string');
    });

    it('should accept string for error', () => {
      const error = 'Database connection failed';
      const response = new GetSupervisorForPsoResponse(undefined, undefined, error);

      expect(typeof response.error).toBe('string');
    });

    it('should return object from toPayload', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = new GetSupervisorForPsoResponse(supervisor);
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
      const response = GetSupervisorForPsoResponse.withSupervisor(supervisor);
      const payload = response.toPayload();

      expect(payload.supervisor).toBe(supervisor);
      expect(payload.message).toBeUndefined();
      expect(payload.error).toBeUndefined();
    });

    it('should handle supervisor not found scenario', () => {
      const message = 'No supervisor found for the given PSO';
      const response = GetSupervisorForPsoResponse.withMessage(message);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBe(message);
      expect(payload.error).toBeUndefined();
    });

    it('should handle supervisor not assigned scenario', () => {
      const message = 'Supervisor not assigned to this PSO';
      const response = GetSupervisorForPsoResponse.withMessage(message);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBe(message);
      expect(payload.error).toBeUndefined();
    });

    it('should handle invalid PSO identifier scenario', () => {
      const error = 'Invalid PSO identifier provided';
      const response = GetSupervisorForPsoResponse.withError(error);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBeUndefined();
      expect(payload.error).toBe(error);
    });

    it('should handle database error scenario', () => {
      const error = 'Database connection failed';
      const response = GetSupervisorForPsoResponse.withError(error);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBeUndefined();
      expect(payload.error).toBe(error);
    });

    it('should handle permission denied scenario', () => {
      const error = 'Permission denied to access PSO data';
      const response = GetSupervisorForPsoResponse.withError(error);
      const payload = response.toPayload();

      expect(payload.supervisor).toBeUndefined();
      expect(payload.message).toBeUndefined();
      expect(payload.error).toBe(error);
    });

    it('should handle supervisor with different email domains scenario', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@company.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorForPsoResponse.withSupervisor(supervisor);

      expect(response.supervisor?.email).toBe('supervisor@company.com');
    });

    it('should handle supervisor with subdomain email scenario', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'supervisor@subdomain.example.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorForPsoResponse.withSupervisor(supervisor);

      expect(response.supervisor?.email).toBe('supervisor@subdomain.example.com');
    });

    it('should handle supervisor with different Azure AD Object ID formats scenario', () => {
      const supervisor = {
        id: 'supervisor-123',
        azureAdObjectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'supervisor@example.com',
        fullName: 'John Doe'
      };
      const response = GetSupervisorForPsoResponse.withSupervisor(supervisor);

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

      const response1 = GetSupervisorForPsoResponse.withSupervisor(supervisor1);
      const response2 = GetSupervisorForPsoResponse.withSupervisor(supervisor2);
      const response3 = GetSupervisorForPsoResponse.withSupervisor(supervisor3);

      expect(response1.supervisor?.fullName).toBe('John Doe');
      expect(response2.supervisor?.fullName).toBe('Dr. Jane Smith');
      expect(response3.supervisor?.fullName).toBe('José María');
    });
  });
});
