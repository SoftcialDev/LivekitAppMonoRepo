import { parseConnectionString, getStorageCredentials } from '../../../src/infrastructure/services/storageCredentials';
import { config } from '../../../src/config';
import { StorageCredentialsError } from '../../../src/domain/errors/InfrastructureErrors';
import { normalizeBase64Padding } from '../../../src/utils/base64Utils';

jest.mock('../../../src/config', () => ({
  config: {
    storageConnectionString: undefined,
    accountName: 'testaccount',
    accountKey: Buffer.alloc(64).toString('base64'),
  },
}));
jest.mock('../../../src/utils/base64Utils', () => ({
  normalizeBase64Padding: jest.fn((key: string) => key),
}));

const mockNormalizeBase64Padding = normalizeBase64Padding as jest.MockedFunction<typeof normalizeBase64Padding>;

describe('storageCredentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeBase64Padding.mockImplementation((key) => key);
  });

  describe('parseConnectionString', () => {
    it('should parse valid connection string', () => {
      const connStr = 'DefaultEndpointsProtocol=https;AccountName=mystorage;AccountKey=abc123;EndpointSuffix=core.windows.net';
      const result = parseConnectionString(connStr);

      expect(result).toEqual({
        accountName: 'mystorage',
        accountKey: 'abc123',
      });
    });

    it('should normalize account key padding', () => {
      const connStr = 'DefaultEndpointsProtocol=https;AccountName=mystorage;AccountKey=abc123;EndpointSuffix=core.windows.net';
      mockNormalizeBase64Padding.mockReturnValue('normalized-key');

      const result = parseConnectionString(connStr);

      expect(mockNormalizeBase64Padding).toHaveBeenCalledWith('abc123');
      expect(result?.accountKey).toBe('normalized-key');
    });

    it('should return null for invalid connection string', () => {
      const connStr = 'InvalidString';
      const result = parseConnectionString(connStr);

      expect(result).toBeNull();
    });

    it('should return null for connection string without AccountName', () => {
      const connStr = 'DefaultEndpointsProtocol=https;AccountKey=abc123;EndpointSuffix=core.windows.net';
      const result = parseConnectionString(connStr);

      expect(result).toBeNull();
    });

    it('should return null for connection string without AccountKey', () => {
      const connStr = 'DefaultEndpointsProtocol=https;AccountName=mystorage;EndpointSuffix=core.windows.net';
      const result = parseConnectionString(connStr);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseConnectionString('');

      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const result = parseConnectionString(null as any);

      expect(result).toBeNull();
    });
  });

  describe('getStorageCredentials', () => {
    it('should return credentials from connection string when available', () => {
      const originalConfig = { ...config };
      (config as any).storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=connaccount;AccountKey=connkey;EndpointSuffix=core.windows.net';
      mockNormalizeBase64Padding.mockReturnValue('connkey');

      const result = getStorageCredentials();

      expect(result.accountName).toBe('connaccount');
      expect(result.accountKey).toBe('connkey');
      
      (config as any).storageConnectionString = originalConfig.storageConnectionString;
    });

    it('should return credentials from individual variables when connection string is not available', () => {
      const originalConfig = { ...config };
      (config as any).storageConnectionString = undefined;
      (config as any).accountName = 'testaccount';
      (config as any).accountKey = 'testkey';

      const result = getStorageCredentials();

      expect(result.accountName).toBe('testaccount');
      expect(result.accountKey).toBe('testkey');
      
      (config as any).storageConnectionString = originalConfig.storageConnectionString;
    });

    it('should throw StorageCredentialsError when no credentials are available', () => {
      const originalConfig = { ...config };
      (config as any).storageConnectionString = undefined;
      (config as any).accountName = undefined;
      (config as any).accountKey = undefined;

      expect(() => getStorageCredentials()).toThrow(StorageCredentialsError);
      expect(() => getStorageCredentials()).toThrow('Azure Storage credentials not found');
      
      (config as any).storageConnectionString = originalConfig.storageConnectionString;
      (config as any).accountName = originalConfig.accountName;
      (config as any).accountKey = originalConfig.accountKey;
    });

    it('should throw StorageCredentialsError when connection string is invalid and individual vars are missing', () => {
      const originalConfig = { ...config };
      (config as any).storageConnectionString = 'InvalidString';
      (config as any).accountName = undefined;
      (config as any).accountKey = undefined;

      expect(() => getStorageCredentials()).toThrow(StorageCredentialsError);
      
      (config as any).storageConnectionString = originalConfig.storageConnectionString;
      (config as any).accountName = originalConfig.accountName;
      (config as any).accountKey = originalConfig.accountKey;
    });
  });
});

