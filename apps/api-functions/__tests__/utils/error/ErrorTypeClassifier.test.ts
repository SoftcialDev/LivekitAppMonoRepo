import { ErrorTypeClassifier } from '../../../src/utils/error/ErrorTypeClassifier';
import { ExpectedError } from '../../../src/middleware/errorHandler';
import { DomainError } from '../../../src/domain/errors';
import { ErrorType } from '../../../src/domain/enums/ErrorType';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';

describe('ErrorTypeClassifier', () => {
  describe('classify', () => {
    it('should classify ExpectedError as expected', () => {
      const error = new ExpectedError('Test error', 400);
      const classification = ErrorTypeClassifier.classify(error);

      expect(classification.type).toBe(ErrorType.Expected);
      expect(classification.statusCode).toBe(400);
      expect(classification.shouldLog).toBe(true);
    });

    it('should classify DomainError as expected', () => {
      class TestDomainError extends DomainError {
        constructor(message: string) {
          super(message, 404);
        }
      }

      const error = new TestDomainError('Not found');
      const classification = ErrorTypeClassifier.classify(error);

      expect(classification.type).toBe(ErrorType.Expected);
      expect(classification.statusCode).toBe(404);
      expect(classification.shouldLog).toBe(true);
    });

    it('should classify Error as unexpected', () => {
      const error = new Error('Unexpected error');
      const classification = ErrorTypeClassifier.classify(error);

      expect(classification.type).toBe(ErrorType.Unexpected);
      expect(classification.statusCode).toBe(500);
      expect(classification.shouldLog).toBe(true);
      expect(classification.severity).toBe(ErrorSeverity.Critical);
    });

    it('should classify unknown types as unknown', () => {
      const error = 'String error';
      const classification = ErrorTypeClassifier.classify(error);

      expect(classification.type).toBe(ErrorType.Unknown);
      expect(classification.statusCode).toBe(500);
      expect(classification.shouldLog).toBe(true);
      expect(classification.severity).toBe(ErrorSeverity.High);
    });

    it('should determine severity based on status code', () => {
      const error400 = new ExpectedError('Bad request', 400);
      const error500 = new ExpectedError('Server error', 500);

      const classification400 = ErrorTypeClassifier.classify(error400);
      const classification500 = ErrorTypeClassifier.classify(error500);

      expect(classification400.severity).toBe(ErrorSeverity.Medium);
      expect(classification500.severity).toBe(ErrorSeverity.Critical);
    });

    it('should handle different status codes correctly', () => {
      const error404 = new ExpectedError('Not found', 404);
      const error403 = new ExpectedError('Forbidden', 403);
      const error401 = new ExpectedError('Unauthorized', 401);

      const classification404 = ErrorTypeClassifier.classify(error404);
      const classification403 = ErrorTypeClassifier.classify(error403);
      const classification401 = ErrorTypeClassifier.classify(error401);

      expect(classification404.statusCode).toBe(404);
      expect(classification403.statusCode).toBe(403);
      expect(classification401.statusCode).toBe(401);
    });
  });
});

