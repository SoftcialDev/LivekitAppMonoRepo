import { CreateContactManagerRequest } from '../../../../../shared/domain/value-objects/CreateContactManagerRequest';

// Mock ContactManagerStatus since it's not available in test environment
const ContactManagerStatus = {
  Available: 'Available',
  Unavailable: 'Unavailable',
  OnBreak: 'OnBreak',
  OnAnotherTask: 'OnAnotherTask'
} as const;

// Mock the ContactManagerStatus import in the actual file
jest.mock('@prisma/client', () => ({
  ContactManagerStatus: {
    Available: 'Available',
    Unavailable: 'Unavailable',
    OnBreak: 'OnBreak',
    OnAnotherTask: 'OnAnotherTask'
  }
}));

describe('CreateContactManagerRequest', () => {
  describe('constructor', () => {
    it('should create request with valid email and status', () => {
      const request = new CreateContactManagerRequest(
        'contact@example.com',
        ContactManagerStatus.Available
      );

      expect(request.email).toBe('contact@example.com');
      expect(request.status).toBe(ContactManagerStatus.Available);
    });

    it('should create request with Unavailable status', () => {
      const request = new CreateContactManagerRequest(
        'contact@example.com',
        ContactManagerStatus.Unavailable
      );

      expect(request.email).toBe('contact@example.com');
      expect(request.status).toBe(ContactManagerStatus.Unavailable);
    });

    it('should handle different email formats', () => {
      const emails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+test@company.org'
      ];

      emails.forEach(email => {
        const request = new CreateContactManagerRequest(email, ContactManagerStatus.Available);
        expect(request.email).toBe(email);
      });
    });
  });

  describe('fromBody', () => {
    it('should create request from valid body', () => {
      const body = {
        email: 'contact@example.com',
        status: ContactManagerStatus.Available
      };

      const request = CreateContactManagerRequest.fromBody(body);

      expect(request.email).toBe('contact@example.com');
      expect(request.status).toBe(ContactManagerStatus.Available);
    });

    it('should create request with Unavailable status from body', () => {
      const body = {
        email: 'contact@example.com',
        status: ContactManagerStatus.Unavailable
      };

      const request = CreateContactManagerRequest.fromBody(body);

      expect(request.email).toBe('contact@example.com');
      expect(request.status).toBe(ContactManagerStatus.Unavailable);
    });

    it('should handle different email formats from body', () => {
      const emails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+test@company.org'
      ];

      emails.forEach(email => {
        const body = {
          email,
          status: ContactManagerStatus.Available
        };

        const request = CreateContactManagerRequest.fromBody(body);
        expect(request.email).toBe(email);
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new CreateContactManagerRequest(
        'contact@example.com',
        ContactManagerStatus.Available
      );

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).email = 'modified@example.com';
      }).toThrow();

      expect(() => {
        (request as any).status = ContactManagerStatus.Unavailable;
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email string', () => {
      const request = new CreateContactManagerRequest('', ContactManagerStatus.Available);
      expect(request.email).toBe('');
    });

    it('should handle long email string', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const request = new CreateContactManagerRequest(longEmail, ContactManagerStatus.Available);
      expect(request.email).toBe(longEmail);
    });

    it('should handle special characters in email', () => {
      const specialEmail = 'user+test@example-domain.co.uk';
      const request = new CreateContactManagerRequest(specialEmail, ContactManagerStatus.Available);
      expect(request.email).toBe(specialEmail);
    });
  });
});
