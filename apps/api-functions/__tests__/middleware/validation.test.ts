import { Context } from '@azure/functions';
import { requirePSOTarget, requireActiveUserTarget } from '../../src/middleware/validation';
import { UserRepository } from '../../src/infrastructure/repositories/UserRepository';
import { TargetNotPsoError, TargetUserNotFoundError, TargetUserInactiveError } from '../../src/domain/errors';
import { TestUtils } from '../setup';

jest.mock('../../src/infrastructure/repositories/UserRepository');

describe('validation middleware', () => {
  let mockContext: Context;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepository);

    jest.clearAllMocks();
  });

  describe('requirePSOTarget', () => {
    it('should pass when target is a PSO', async () => {
      const targetEmail = 'pso@example.com';
      mockUserRepository.isPSO.mockResolvedValue(true);

      const middleware = requirePSOTarget();
      await middleware(mockContext, targetEmail);

      expect(mockUserRepository.isPSO).toHaveBeenCalledWith(targetEmail);
    });

    it('should throw TargetNotPsoError when target is not a PSO', async () => {
      const targetEmail = 'not-pso@example.com';
      mockUserRepository.isPSO.mockResolvedValue(false);

      const middleware = requirePSOTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(TargetNotPsoError);
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow('Target user not found or not a PSO');
    });

    it('should handle repository errors', async () => {
      const targetEmail = 'pso@example.com';
      const error = new Error('Database error');
      mockUserRepository.isPSO.mockRejectedValue(error);

      const middleware = requirePSOTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow('Database error');
    });
  });

  describe('requireActiveUserTarget', () => {
    it('should pass when user exists and is active', async () => {
      const targetEmail = 'user@example.com';
      const user = {
        id: 'user-id',
        email: targetEmail,
        deletedAt: null,
      };

      mockUserRepository.findByEmail.mockResolvedValue(user as any);

      const middleware = requireActiveUserTarget();
      await middleware(mockContext, targetEmail);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(targetEmail);
    });

    it('should throw TargetUserNotFoundError when user does not exist', async () => {
      const targetEmail = 'not-found@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(TargetUserNotFoundError);
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow('Target user not found');
    });

    it('should throw TargetUserInactiveError when user is deleted', async () => {
      const targetEmail = 'inactive@example.com';
      const user = {
        id: 'user-id',
        email: targetEmail,
        deletedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(user as any);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow(TargetUserInactiveError);
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow('Target user is inactive');
    });

    it('should handle repository errors', async () => {
      const targetEmail = 'user@example.com';
      const error = new Error('Database error');
      mockUserRepository.findByEmail.mockRejectedValue(error);

      const middleware = requireActiveUserTarget();
      
      await expect(middleware(mockContext, targetEmail)).rejects.toThrow('Database error');
    });
  });
});

