import { INITIAL_USER_INFO_STATE } from '@/modules/auth/stores/user-info-store/constants/userInfoConstants';

describe('userInfoConstants', () => {
  describe('INITIAL_USER_INFO_STATE', () => {
    it('should have userInfo set to null', () => {
      expect(INITIAL_USER_INFO_STATE.userInfo).toBeNull();
    });

    it('should have isLoading set to false', () => {
      expect(INITIAL_USER_INFO_STATE.isLoading).toBe(false);
    });

    it('should be a readonly object', () => {
      // TypeScript ensures this is readonly with 'as const', but we can verify structure
      expect(typeof INITIAL_USER_INFO_STATE).toBe('object');
      expect(INITIAL_USER_INFO_STATE).toHaveProperty('userInfo');
      expect(INITIAL_USER_INFO_STATE).toHaveProperty('isLoading');
    });

    it('should match expected structure', () => {
      expect(INITIAL_USER_INFO_STATE).toEqual({
        userInfo: null,
        isLoading: false,
      });
    });
  });
});


