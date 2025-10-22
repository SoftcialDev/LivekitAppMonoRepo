import { requireEmployeeTarget, requireActiveUserTarget } from '../../../shared/middleware/validation';
import { Context } from '@azure/functions';
import { UserRepository } from '../../../shared/infrastructure/repositories/UserRepository';

// Mock UserRepository
jest.mock('../../../shared/infrastructure/repositories/UserRepository');

const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('validation middleware', () => {
  let mockContext: Context;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockContext = {} as any;
    
    // Create mock instance
    mockUserRepository = {
      isEmployee: jest.fn(),
      findByEmail: jest.fn()
    } as any;
    
    // Mock the constructor to return our mock instance
    MockedUserRepository.mockImplementation(() => mockUserRepository);
    
    jest.clearAllMocks();
  });

  describe('requireEmployeeTarget', () => {
    it('should create middleware that validates employee target', async () => {
      const targetEmail = 'employee@example.com';
      mockUserRepository.isEmployee.mockResolvedValue(true);

      const middleware = requireEmployeeTarget();
      await middleware(mockContext, targetEmail);

      expect(mockUserRepository.isEmployee).toHaveBeenCalledWith(targetEmail);
    });

    it('should throw error when target is not an employee', async () => {
      const targetEmail = 'nonemployee@example.com';
      mockUserRepository.isEmployee.mockResolvedValue(false);

      const middleware = requireEmployeeTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Target user not found or not an Employee'
      );
      
      expect(mockUserRepository.isEmployee).toHaveBeenCalledWith(targetEmail);
    });

    it('should handle different email formats', async () => {
      const testCases = [
        'user@example.com',
        'user.name@company.org',
        'user+tag@domain.co.uk',
        'user123@test-domain.com'
      ];

      for (const email of testCases) {
        mockUserRepository.isEmployee.mockResolvedValue(true);
        const middleware = requireEmployeeTarget();
        
        await middleware(mockContext, email);
        
        expect(mockUserRepository.isEmployee).toHaveBeenCalledWith(email);
      }
    });

    it('should handle repository errors', async () => {
      const targetEmail = 'employee@example.com';
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.isEmployee.mockRejectedValue(repositoryError);

      const middleware = requireEmployeeTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle empty email', async () => {
      const targetEmail = '';
      mockUserRepository.isEmployee.mockResolvedValue(false);

      const middleware = requireEmployeeTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Target user not found or not an Employee'
      );
    });

    it('should handle null email', async () => {
      const targetEmail = null as any;
      mockUserRepository.isEmployee.mockResolvedValue(false);

      const middleware = requireEmployeeTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Target user not found or not an Employee'
      );
    });

    it('should create new repository instance for each middleware', () => {
      const middleware1 = requireEmployeeTarget();
      const middleware2 = requireEmployeeTarget();
      
      expect(MockedUserRepository).toHaveBeenCalledTimes(2);
      expect(middleware1).not.toBe(middleware2);
    });
  });

  describe('requireActiveUserTarget', () => {
    it('should create middleware that validates active user target', async () => {
      const targetEmail = 'user@example.com';
      const mockUser = {
        id: 'user-123',
        email: targetEmail,
        deletedAt: null
      };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const middleware = requireActiveUserTarget();
      await middleware(mockContext, targetEmail);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(targetEmail);
    });

    it('should throw error when user is not found', async () => {
      const targetEmail = 'nonexistent@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Target user not found or inactive'
      );
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(targetEmail);
    });

    it('should throw error when user is deleted', async () => {
      const targetEmail = 'deleted@example.com';
      const mockUser = {
        id: 'user-123',
        email: targetEmail,
        deletedAt: new Date('2023-01-01')
      };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Target user not found or inactive'
      );
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(targetEmail);
    });

    it('should handle different email formats', async () => {
      const testCases = [
        'user@example.com',
        'user.name@company.org',
        'user+tag@domain.co.uk',
        'user123@test-domain.com'
      ];

      for (const email of testCases) {
        const mockUser = {
          id: 'user-123',
          email,
          deletedAt: null
        };
        mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
        const middleware = requireActiveUserTarget();
        
        await middleware(mockContext, email);
        
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      }
    });

    it('should handle repository errors', async () => {
      const targetEmail = 'user@example.com';
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.findByEmail.mockRejectedValue(repositoryError);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle empty email', async () => {
      const targetEmail = '';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Target user not found or inactive'
      );
    });

    it('should handle null email', async () => {
      const targetEmail = null as any;
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(
        'Target user not found or inactive'
      );
    });

    it('should handle user with undefined deletedAt', async () => {
      const targetEmail = 'user@example.com';
      const mockUser = {
        id: 'user-123',
        email: targetEmail,
        deletedAt: undefined
      };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const middleware = requireActiveUserTarget();
      
      // undefined deletedAt is falsy, so user should be considered active
      await middleware(mockContext, targetEmail);
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(targetEmail);
    });

    it('should create new repository instance for each middleware', () => {
      const middleware1 = requireActiveUserTarget();
      const middleware2 = requireActiveUserTarget();
      
      expect(MockedUserRepository).toHaveBeenCalledTimes(2);
      expect(middleware1).not.toBe(middleware2);
    });
  });

  describe('edge cases', () => {
    it('should handle context with minimal properties', async () => {
      mockContext = {} as any;
      const targetEmail = 'user@example.com';
      mockUserRepository.isEmployee.mockResolvedValue(true);

      const middleware = requireEmployeeTarget();
      await middleware(mockContext, targetEmail);

      expect(mockUserRepository.isEmployee).toHaveBeenCalledWith(targetEmail);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      mockUserRepository.isEmployee.mockResolvedValue(true);

      const middleware = requireEmployeeTarget();
      await middleware(mockContext, longEmail);

      expect(mockUserRepository.isEmployee).toHaveBeenCalledWith(longEmail);
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example-domain.co.uk';
      mockUserRepository.isEmployee.mockResolvedValue(true);

      const middleware = requireEmployeeTarget();
      await middleware(mockContext, specialEmail);

      expect(mockUserRepository.isEmployee).toHaveBeenCalledWith(specialEmail);
    });

    it('should handle unicode characters in email', async () => {
      const unicodeEmail = 'usér@éxample.com';
      mockUserRepository.isEmployee.mockResolvedValue(true);

      const middleware = requireEmployeeTarget();
      await middleware(mockContext, unicodeEmail);

      expect(mockUserRepository.isEmployee).toHaveBeenCalledWith(unicodeEmail);
    });
  });
});
