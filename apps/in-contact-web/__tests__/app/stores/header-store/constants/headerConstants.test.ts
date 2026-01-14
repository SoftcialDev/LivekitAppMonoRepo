import { DEFAULT_HEADER } from '@/app/stores/header-store/constants';

describe('headerConstants', () => {
  describe('DEFAULT_HEADER', () => {
    it('should have empty title', () => {
      expect(DEFAULT_HEADER.title).toBe('');
    });

    it('should have undefined iconSrc', () => {
      expect(DEFAULT_HEADER.iconSrc).toBeUndefined();
    });

    it('should have undefined iconAlt', () => {
      expect(DEFAULT_HEADER.iconAlt).toBeUndefined();
    });

    it('should have undefined iconNode', () => {
      expect(DEFAULT_HEADER.iconNode).toBeUndefined();
    });
  });
});

