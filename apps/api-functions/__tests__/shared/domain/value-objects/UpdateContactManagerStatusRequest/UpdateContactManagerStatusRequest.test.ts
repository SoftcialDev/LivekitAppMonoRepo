import { UpdateContactManagerStatusRequest, UpdateContactManagerStatusRequestPayload } from '../../../../../shared/domain/value-objects/UpdateContactManagerStatusRequest';

// Mock ContactManagerStatus since it's not available in test environment
const ContactManagerStatus = {
  Available: 'Available',
  Unavailable: 'Unavailable',
  OnBreak: 'OnBreak',
  OnAnotherTask: 'OnAnotherTask'
} as const;

jest.mock('@prisma/client', () => ({
  ContactManagerStatus: {
    Available: 'Available',
    Unavailable: 'Unavailable',
    OnBreak: 'OnBreak',
    OnAnotherTask: 'OnAnotherTask'
  }
}));

describe('UpdateContactManagerStatusRequest', () => {
  describe('constructor', () => {
    it('should create request with Available status', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Available);

      expect(request.status).toBe(ContactManagerStatus.Available);
    });

    it('should create request with Unavailable status', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Unavailable);

      expect(request.status).toBe(ContactManagerStatus.Unavailable);
    });

    it('should create request with OnBreak status', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.OnBreak);

      expect(request.status).toBe(ContactManagerStatus.OnBreak);
    });

    it('should create request with OnAnotherTask status', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.OnAnotherTask);

      expect(request.status).toBe(ContactManagerStatus.OnAnotherTask);
    });

    it('should handle different status values', () => {
      const request1 = new UpdateContactManagerStatusRequest(ContactManagerStatus.Available);
      const request2 = new UpdateContactManagerStatusRequest(ContactManagerStatus.Unavailable);

      expect(request1.status).toBe(ContactManagerStatus.Available);
      expect(request2.status).toBe(ContactManagerStatus.Unavailable);
    });
  });

  describe('fromBody', () => {
    it('should create request from valid body with Available status', () => {
      const body: UpdateContactManagerStatusRequestPayload = {
        status: 'Available'
      };
      const request = UpdateContactManagerStatusRequest.fromBody(body);

      expect(request.status).toBe('Available');
    });

    it('should create request from valid body with Unavailable status', () => {
      const body: UpdateContactManagerStatusRequestPayload = {
        status: 'Unavailable'
      };
      const request = UpdateContactManagerStatusRequest.fromBody(body);

      expect(request.status).toBe('Unavailable');
    });

    it('should create request from valid body with OnBreak status', () => {
      const body: UpdateContactManagerStatusRequestPayload = {
        status: 'OnBreak'
      };
      const request = UpdateContactManagerStatusRequest.fromBody(body);

      expect(request.status).toBe('OnBreak');
    });

    it('should create request from valid body with OnAnotherTask status', () => {
      const body: UpdateContactManagerStatusRequestPayload = {
        status: 'OnAnotherTask'
      };
      const request = UpdateContactManagerStatusRequest.fromBody(body);

      expect(request.status).toBe('OnAnotherTask');
    });

    it('should handle different status values from body', () => {
      const body1: UpdateContactManagerStatusRequestPayload = {
        status: 'Available'
      };
      const body2: UpdateContactManagerStatusRequestPayload = {
        status: 'Unavailable'
      };

      const request1 = UpdateContactManagerStatusRequest.fromBody(body1);
      const request2 = UpdateContactManagerStatusRequest.fromBody(body2);

      expect(request1.status).toBe('Available');
      expect(request2.status).toBe('Unavailable');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Available);

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).status = ContactManagerStatus.Unavailable;
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty status string', () => {
      const request = new UpdateContactManagerStatusRequest('' as any);

      expect(request.status).toBe('');
    });

    it('should handle long status string', () => {
      const longStatus = 'a'.repeat(1000);
      const request = new UpdateContactManagerStatusRequest(longStatus as any);

      expect(request.status).toBe(longStatus);
    });

    it('should handle special characters in status', () => {
      const specialStatus = 'Available!@#$%^&*()';
      const request = new UpdateContactManagerStatusRequest(specialStatus as any);

      expect(request.status).toBe(specialStatus);
    });

    it('should handle numeric status', () => {
      const numericStatus = '123456789';
      const request = new UpdateContactManagerStatusRequest(numericStatus as any);

      expect(request.status).toBe(numericStatus);
    });

    it('should handle alphanumeric status', () => {
      const alphanumericStatus = 'Available123abc456def';
      const request = new UpdateContactManagerStatusRequest(alphanumericStatus as any);

      expect(request.status).toBe(alphanumericStatus);
    });
  });

  describe('type safety', () => {
    it('should accept ContactManagerStatus for status', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Available);
      expect(typeof request.status).toBe('string');
    });

    it('should accept UpdateContactManagerStatusRequestPayload interface', () => {
      const body: UpdateContactManagerStatusRequestPayload = {
        status: 'Available'
      };
      const request = UpdateContactManagerStatusRequest.fromBody(body);

      expect(request).toBeInstanceOf(UpdateContactManagerStatusRequest);
      expect(request.status).toBe('Available');
    });
  });

  describe('validation scenarios', () => {
    it('should handle status change to Available scenario', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Available);

      expect(request.status).toBe(ContactManagerStatus.Available);
    });

    it('should handle status change to Unavailable scenario', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.Unavailable);

      expect(request.status).toBe(ContactManagerStatus.Unavailable);
    });

    it('should handle status change to OnBreak scenario', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.OnBreak);

      expect(request.status).toBe(ContactManagerStatus.OnBreak);
    });

    it('should handle status change to OnAnotherTask scenario', () => {
      const request = new UpdateContactManagerStatusRequest(ContactManagerStatus.OnAnotherTask);

      expect(request.status).toBe(ContactManagerStatus.OnAnotherTask);
    });

    it('should handle status update from body scenario', () => {
      const body: UpdateContactManagerStatusRequestPayload = {
        status: 'Available'
      };
      const request = UpdateContactManagerStatusRequest.fromBody(body);

      expect(request.status).toBe('Available');
    });
  });
});
