import { AuthenticationError, NotSignedInError } from '@/modules/auth/errors';

describe('authErrors', () => {
  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with a message', () => {
      const error = new AuthenticationError('Test error message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create an AuthenticationError with a cause', () => {
      const cause = new Error('Original error');
      const error = new AuthenticationError('Test error message', cause);
      
      expect(error.message).toBe('Test error message');
      expect(error.cause).toBe(cause);
    });
  });

  describe('NotSignedInError', () => {
    it('should create a NotSignedInError with default message', () => {
      const error = new NotSignedInError();
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('No signed-in account. Please log in to perform this operation.');
      expect(error.name).toBe('NotSignedInError');
    });

    it('should create a NotSignedInError with a cause', () => {
      const cause = new Error('Original error');
      const error = new NotSignedInError(cause);
      
      expect(error.message).toBe('No signed-in account. Please log in to perform this operation.');
      expect(error.cause).toBe(cause);
    });
  });
});

