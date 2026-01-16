import { UserInfoService } from '@/modules/auth/services/UserInfoService';
import { UserRole } from '@/modules/auth/enums';
import type { UserInfo } from '@/modules/auth/types';

// Mock logger
jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
}));

describe('UserInfoService', () => {
  const mockUserInfo: UserInfo = {
    azureAdObjectId: 'test-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.PSO,
    permissions: ['permission1'],
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save user info to localStorage', () => {
      UserInfoService.save(mockUserInfo);
      
      const stored = localStorage.getItem('userInfo');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(mockUserInfo);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        UserInfoService.save(mockUserInfo);
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('load', () => {
    it('should load user info from localStorage', () => {
      localStorage.setItem('userInfo', JSON.stringify(mockUserInfo));
      
      const loaded = UserInfoService.load();
      
      expect(loaded).toEqual(mockUserInfo);
    });

    it('should return null if no user info exists', () => {
      const loaded = UserInfoService.load();
      
      expect(loaded).toBeNull();
    });

    it('should return null if stored data is invalid JSON', () => {
      localStorage.setItem('userInfo', 'invalid json');
      
      const loaded = UserInfoService.load();
      
      expect(loaded).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const loaded = UserInfoService.load();
      
      expect(loaded).toBeNull();

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('clear', () => {
    it('should clear user info from localStorage', () => {
      localStorage.setItem('userInfo', JSON.stringify(mockUserInfo));
      
      UserInfoService.clear();
      
      const stored = localStorage.getItem('userInfo');
      expect(stored).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        UserInfoService.clear();
      }).not.toThrow();

      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe('hasUserInfo', () => {
    it('should return true if user info exists', () => {
      localStorage.setItem('userInfo', JSON.stringify(mockUserInfo));
      
      expect(UserInfoService.hasUserInfo()).toBe(true);
    });

    it('should return false if no user info exists', () => {
      expect(UserInfoService.hasUserInfo()).toBe(false);
    });

    it('should return false if stored data is invalid', () => {
      localStorage.setItem('userInfo', 'invalid json');
      
      expect(UserInfoService.hasUserInfo()).toBe(false);
    });
  });
});



