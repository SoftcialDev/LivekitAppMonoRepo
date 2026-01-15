import { GetCameraFailuresResponse } from '../../../src/domain/value-objects/GetCameraFailuresResponse';
import { ValidationError } from '../../../src/domain/errors/DomainError';

describe('GetCameraFailuresResponse', () => {
  describe('fromFailure', () => {
    it('should create response from single failure', () => {
      const failure = { id: 'failure-id', stage: 'Permission' };
      const response = GetCameraFailuresResponse.fromFailure(failure);

      expect(response).toBeInstanceOf(GetCameraFailuresResponse);
    });
  });

  describe('toSinglePayload', () => {
    it('should convert single failure to payload', () => {
      const failure = { id: 'failure-id', stage: 'Permission' };
      const response = GetCameraFailuresResponse.fromFailure(failure);
      const payload = response.toSinglePayload();

      expect(payload).toEqual(failure);
    });

    it('should throw ValidationError when no failures exist', () => {
      const response = GetCameraFailuresResponse.fromFailures([], 0);
      
      expect(() => {
        response.toSinglePayload();
      }).toThrow(ValidationError);
    });
  });
});

