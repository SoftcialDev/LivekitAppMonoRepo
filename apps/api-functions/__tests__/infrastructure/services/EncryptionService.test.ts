import { EncryptionService } from '../../../src/infrastructure/services/EncryptionService';
import { ConfigurationError } from '../../../src/domain/errors/InfrastructureErrors';

// Generate a valid 32-byte base64 key for testing
const generateValidKey = (): string => {
  return Buffer.alloc(32, 'a').toString('base64');
};

describe('EncryptionService', () => {
  describe('constructor', () => {
    it('should create service with valid base64 key', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      expect(service).toBeInstanceOf(EncryptionService);
    });

    it('should throw ConfigurationError when key is missing', () => {
      expect(() => {
        new EncryptionService('');
      }).toThrow(ConfigurationError);
      expect(() => {
        new EncryptionService('');
      }).toThrow('Encryption key is required');
    });

    it('should throw ConfigurationError when key does not decode to 32 bytes', () => {
      const invalidKey = Buffer.alloc(16, 'a').toString('base64');
      expect(() => {
        new EncryptionService(invalidKey);
      }).toThrow(ConfigurationError);
      expect(() => {
        new EncryptionService(invalidKey);
      }).toThrow('Encryption key must decode to 32 bytes (256 bits)');
    });

    it('should call onDefaultKey callback when provided', () => {
      const key = generateValidKey();
      const onDefaultKey = jest.fn();
      new EncryptionService(key, { onDefaultKey });
      expect(onDefaultKey).toHaveBeenCalled();
    });

    it('should not call onDefaultKey callback when not provided', () => {
      const key = generateValidKey();
      expect(() => {
        new EncryptionService(key);
      }).not.toThrow();
    });
  });

  describe('encrypt', () => {
    it('should encrypt plain text and return base64 string', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const plainText = 'test message';

      const encrypted = service.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different encrypted values for same input', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const plainText = 'test message';

      const encrypted1 = service.encrypt(plainText);
      const encrypted2 = service.encrypt(plainText);

      // Different IVs should produce different encrypted values
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt empty string', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);

      const encrypted = service.encrypt('');

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should encrypt special characters', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const plainText = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = service.encrypt(plainText);

      expect(encrypted).toBeDefined();
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plainText);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text to original plain text', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const plainText = 'test message';

      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt empty string', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);

      const encrypted = service.encrypt('');
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should decrypt special characters correctly', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const plainText = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error when decrypting with wrong key', () => {
      const key1 = generateValidKey();
      const key2 = Buffer.alloc(32, 'b').toString('base64');
      const service1 = new EncryptionService(key1);
      const service2 = new EncryptionService(key2);
      const plainText = 'test message';

      const encrypted = service1.encrypt(plainText);

      expect(() => {
        service2.decrypt(encrypted);
      }).toThrow();
    });

    it('should throw error when decrypting malformed payload', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);

      expect(() => {
        service.decrypt('invalid-base64');
      }).toThrow();
    });

    it('should throw error when decrypting payload that is too short', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const shortPayload = Buffer.alloc(10).toString('base64');

      expect(() => {
        service.decrypt(shortPayload);
      }).toThrow();
    });
  });

  describe('encrypt and decrypt roundtrip', () => {
    it('should successfully encrypt and decrypt various text lengths', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const testCases = [
        'a',
        'short',
        'medium length text',
        'a'.repeat(100),
        'a'.repeat(1000),
      ];

      testCases.forEach((plainText) => {
        const encrypted = service.encrypt(plainText);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(plainText);
      });
    });

    it('should handle unicode characters', () => {
      const key = generateValidKey();
      const service = new EncryptionService(key);
      const plainText = 'Hello 世界 🌍';

      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });
  });
});

