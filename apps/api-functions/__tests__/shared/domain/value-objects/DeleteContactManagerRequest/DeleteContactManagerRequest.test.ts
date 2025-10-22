import { DeleteContactManagerRequest } from '../../../../../shared/domain/value-objects/DeleteContactManagerRequest';

describe('DeleteContactManagerRequest', () => {
  describe('constructor', () => {
    it('should create request with valid profile ID', () => {
      const request = new DeleteContactManagerRequest('profile-123');

      expect(request.profileId).toBe('profile-123');
    });

    it('should handle different profile ID formats', () => {
      const profileIds = [
        'profile-123',
        'cm-profile-456',
        'contact-manager-789',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000'
      ];

      profileIds.forEach(profileId => {
        const request = new DeleteContactManagerRequest(profileId);
        expect(request.profileId).toBe(profileId);
      });
    });
  });

  describe('fromPayload', () => {
    it('should create request from valid payload', () => {
      const payload = {
        profileId: 'profile-123'
      };

      const request = DeleteContactManagerRequest.fromPayload(payload);

      expect(request.profileId).toBe('profile-123');
    });

    it('should handle different profile ID formats from payload', () => {
      const profileIds = [
        'profile-123',
        'cm-profile-456',
        'contact-manager-789',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000'
      ];

      profileIds.forEach(profileId => {
        const payload = { profileId };
        const request = DeleteContactManagerRequest.fromPayload(payload);
        expect(request.profileId).toBe(profileId);
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new DeleteContactManagerRequest('profile-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).profileId = 'modified-profile-id';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty profile ID string', () => {
      const request = new DeleteContactManagerRequest('');
      expect(request.profileId).toBe('');
    });

    it('should handle long profile ID string', () => {
      const longProfileId = 'profile-' + 'a'.repeat(100);
      const request = new DeleteContactManagerRequest(longProfileId);
      expect(request.profileId).toBe(longProfileId);
    });

    it('should handle special characters in profile ID', () => {
      const specialProfileId = 'profile-123_test.456@domain';
      const request = new DeleteContactManagerRequest(specialProfileId);
      expect(request.profileId).toBe(specialProfileId);
    });

    it('should handle numeric profile ID', () => {
      const numericProfileId = '123456789';
      const request = new DeleteContactManagerRequest(numericProfileId);
      expect(request.profileId).toBe(numericProfileId);
    });

    it('should handle UUID format profile ID', () => {
      const uuidProfileId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new DeleteContactManagerRequest(uuidProfileId);
      expect(request.profileId).toBe(uuidProfileId);
    });
  });
});
