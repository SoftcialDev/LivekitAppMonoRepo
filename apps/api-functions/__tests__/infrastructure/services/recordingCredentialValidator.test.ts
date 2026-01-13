import { validateAccountKey, getValidatedStorageCredentials } from '../../../src/infrastructure/services/recordingCredentialValidator';
import { getStorageCredentials } from '../../../src/infrastructure/services/storageCredentials';
import { config } from '../../../src/config';
import { StorageCredentialsError, ConfigurationError } from '../../../src/domain/errors/InfrastructureErrors';

jest.mock('../../../src/infrastructure/services/storageCredentials');
jest.mock('../../../src/config', () => ({
  config: {
    recordingsContainerName: 'recordings',
    storageConnectionString: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=testkey;EndpointSuffix=core.windows.net',
  },
}));

const mockGetStorageCredentials = getStorageCredentials as jest.MockedFunction<typeof getStorageCredentials>;

describe('recordingCredentialValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAccountKey', () => {
    it('should validate correct 64-byte account key', () => {
      const validKey = Buffer.alloc(64).toString('base64');
      expect(() => validateAccountKey(validKey)).not.toThrow();
    });

    it('should throw ConfigurationError for key with wrong length', () => {
      const invalidKey = Buffer.alloc(32).toString('base64');
      expect(() => validateAccountKey(invalidKey)).toThrow(ConfigurationError);
      expect(() => validateAccountKey(invalidKey)).toThrow('must decode to exactly 64 bytes');
    });

    it('should throw ConfigurationError for empty key', () => {
      expect(() => validateAccountKey('')).toThrow();
    });
  });

  describe('getValidatedStorageCredentials', () => {
    it('should return validated credentials from connection string', () => {
      const validKey = Buffer.alloc(64).toString('base64');
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: validKey,
      });

      const result = getValidatedStorageCredentials();

      expect(result.accountName).toBe('testaccount');
      expect(result.accountKey).toBe(validKey);
      expect(result.containerName).toBe('recordings');
      expect(result.credentialsSource).toBe('connection_string');
    });

    it('should return validated credentials from individual variables', () => {
      const originalConfig = { ...config };
      (config as any).storageConnectionString = undefined;
      const validKey = Buffer.alloc(64).toString('base64');
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: validKey,
      });

      const result = getValidatedStorageCredentials();

      expect(result.accountName).toBe('testaccount');
      expect(result.accountKey).toBe(validKey);
      expect(result.credentialsSource).toBe('individual_vars');
      
      (config as any).storageConnectionString = originalConfig.storageConnectionString;
    });

    it('should throw StorageCredentialsError when getStorageCredentials fails', () => {
      mockGetStorageCredentials.mockImplementation(() => {
        throw new Error('Credentials not found');
      });

      expect(() => getValidatedStorageCredentials()).toThrow(StorageCredentialsError);
      expect(() => getValidatedStorageCredentials()).toThrow('Failed to get Azure Storage credentials');
    });

    it('should throw ConfigurationError when accountName is missing', () => {
      mockGetStorageCredentials.mockReturnValue({
        accountName: '',
        accountKey: Buffer.alloc(64).toString('base64'),
      });

      expect(() => getValidatedStorageCredentials()).toThrow(ConfigurationError);
      expect(() => getValidatedStorageCredentials()).toThrow('AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY are required');
    });

    it('should throw ConfigurationError when accountKey is missing', () => {
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: '',
      });

      expect(() => getValidatedStorageCredentials()).toThrow(ConfigurationError);
    });

    it('should trim accountName and accountKey', () => {
      const validKey = Buffer.alloc(64).toString('base64');
      mockGetStorageCredentials.mockReturnValue({
        accountName: '  testaccount  ',
        accountKey: `  ${validKey}  `,
      });

      const result = getValidatedStorageCredentials();

      expect(result.accountName).toBe('testaccount');
      expect(result.accountKey).toBe(validKey.trim());
    });
  });
});

