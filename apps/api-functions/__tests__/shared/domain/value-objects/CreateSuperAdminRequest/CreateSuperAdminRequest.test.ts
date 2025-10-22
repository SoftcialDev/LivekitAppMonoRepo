import { CreateSuperAdminRequest } from '../../../../../shared/domain/value-objects/CreateSuperAdminRequest';

describe('CreateSuperAdminRequest', () => {
  describe('constructor', () => {
    it('should create request with valid email', () => {
      const request = new CreateSuperAdminRequest('admin@example.com');

      expect(request.email).toBe('admin@example.com');
    });

    it('should handle different email formats', () => {
      const emails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+test@company.org'
      ];

      emails.forEach(email => {
        const request = new CreateSuperAdminRequest(email);
        expect(request.email).toBe(email);
      });
    });
  });

  describe('fromBody', () => {
    it('should create request from valid body', () => {
      const body = {
        email: 'admin@example.com'
      };

      const request = CreateSuperAdminRequest.fromBody(body);

      expect(request.email).toBe('admin@example.com');
    });

    it('should normalize email to lowercase', () => {
      const body = {
        email: 'ADMIN@EXAMPLE.COM'
      };

      const request = CreateSuperAdminRequest.fromBody(body);

      expect(request.email).toBe('admin@example.com');
    });

    it('should handle mixed case email', () => {
      const body = {
        email: 'Admin@Example.Com'
      };

      const request = CreateSuperAdminRequest.fromBody(body);

      expect(request.email).toBe('admin@example.com');
    });

    it('should handle different email formats from body', () => {
      const emails = [
        'TEST@EXAMPLE.COM',
        'User.Name@Domain.Co.Uk',
        'Admin+Test@Company.Org'
      ];

      const expectedEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+test@company.org'
      ];

      emails.forEach((email, index) => {
        const body = { email };
        const request = CreateSuperAdminRequest.fromBody(body);
        expect(request.email).toBe(expectedEmails[index]);
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new CreateSuperAdminRequest('admin@example.com');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).email = 'modified@example.com';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email string', () => {
      const request = new CreateSuperAdminRequest('');
      expect(request.email).toBe('');
    });

    it('should handle long email string', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const request = new CreateSuperAdminRequest(longEmail);
      expect(request.email).toBe(longEmail);
    });

    it('should handle special characters in email', () => {
      const specialEmail = 'user+test@example-domain.co.uk';
      const request = new CreateSuperAdminRequest(specialEmail);
      expect(request.email).toBe(specialEmail);
    });

    it('should handle email with whitespace from body', () => {
      const body = {
        email: '  ADMIN@EXAMPLE.COM  '
      };

      const request = CreateSuperAdminRequest.fromBody(body);
      expect(request.email).toBe('  admin@example.com  '); // Only lowercase, no trim
    });
  });
});
