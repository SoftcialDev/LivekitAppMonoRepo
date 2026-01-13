import { StorageDetailsService } from '../../../src/infrastructure/services/StorageDetailsService';
import { getStorageCredentials } from '../../../src/infrastructure/services/storageCredentials';
import { config } from '../../../src/config';

jest.mock('../../../src/infrastructure/services/storageCredentials');
jest.mock('../../../src/config', () => ({
  config: {
    accountName: 'testaccount',
    accountKey: Buffer.alloc(64).toString('base64'),
    storageConnectionString: 'DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=testkey;EndpointSuffix=core.windows.net',
    recordingsContainerName: 'recordings',
    snapshotContainerName: 'snapshots',
  },
}));

const mockGetStorageCredentials = getStorageCredentials as jest.MockedFunction<typeof getStorageCredentials>;

describe('StorageDetailsService', () => {
  let service: StorageDetailsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageDetailsService();
  });

  describe('getStorageDetails', () => {
    it('should return storage details with all environment variables', () => {
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: Buffer.alloc(64).toString('base64'),
      });

      const details = service.getStorageDetails();

      expect(details.AZURE_STORAGE_ACCOUNT).toBeDefined();
      expect(details.AZURE_STORAGE_ACCOUNT!.exists).toBe(true);
      expect(details.AZURE_STORAGE_KEY).toBeDefined();
      expect(details.AZURE_STORAGE_KEY!.exists).toBe(true);
      expect(details.AZURE_STORAGE_CONNECTION_STRING).toBeDefined();
      expect(details.AZURE_STORAGE_CONNECTION_STRING!.exists).toBe(true);
      expect(details.RECORDINGS_CONTAINER_NAME).toBeDefined();
      expect(details.SNAPSHOT_CONTAINER_NAME).toBeDefined();
    });

    it('should include preview for account name', () => {
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: Buffer.alloc(64).toString('base64'),
      });

      const details = service.getStorageDetails();

      expect(details.AZURE_STORAGE_ACCOUNT!.preview).toBeDefined();
      expect(details.AZURE_STORAGE_ACCOUNT!.preview).toContain('...');
    });

    it('should validate base64 account key', () => {
      const validKey = Buffer.alloc(64).toString('base64');
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: validKey,
      });

      const details = service.getStorageDetails();

      expect(details.AZURE_STORAGE_KEY!.isBase64).toBe(true);
      expect(details.AZURE_STORAGE_KEY!.base64Validation).toBe('valid');
      expect(details.AZURE_STORAGE_KEY!.decodedLength).toBe(64);
    });

    it('should show warning for account key with wrong length', () => {
      const invalidKey = Buffer.alloc(32).toString('base64');
      const originalConfig = { ...config };
      (config as any).accountKey = invalidKey;
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: invalidKey,
      });

      const details = service.getStorageDetails();

      expect(details.AZURE_STORAGE_KEY!.isBase64).toBe(true);
      expect(details.AZURE_STORAGE_KEY!.warning).toBeDefined();
      expect(details.AZURE_STORAGE_KEY!.warning).toContain('Expected 64 bytes');
      
      (config as any).accountKey = originalConfig.accountKey;
    });

    it('should include resolved credentials when available', () => {
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'resolvedaccount',
        accountKey: Buffer.alloc(64).toString('base64'),
      });

      const details = service.getStorageDetails();

      expect(details.RESOLVED_ACCOUNT_KEY).toBeDefined();
      expect(details.RESOLVED_ACCOUNT_KEY?.exists).toBe(true);
      expect(details.RESOLVED_ACCOUNT_NAME).toBeDefined();
      expect(details.RESOLVED_ACCOUNT_NAME?.exists).toBe(true);
    });

    it('should mark source as connection_string when connection string is used', () => {
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: Buffer.alloc(64).toString('base64'),
      });

      const details = service.getStorageDetails();

      expect(details.RESOLVED_ACCOUNT_KEY?.source).toBe('connection_string');
    });

    it('should handle errors when resolving credentials', () => {
      mockGetStorageCredentials.mockImplementation(() => {
        throw new Error('Failed to resolve credentials');
      });

      const details = service.getStorageDetails();

      // When error occurs, credentialsSource is set to 'error' but RESOLVED_ACCOUNT_KEY
      // is only added if resolvedAccountKey is not empty, so it won't be in details
      // The test should verify that the error is handled gracefully
      expect(details.AZURE_STORAGE_ACCOUNT).toBeDefined();
      expect(details.AZURE_STORAGE_KEY).toBeDefined();
    });

    it('should return exists: false for undefined account name', () => {
      const originalConfig = { ...config };
      (config as any).accountName = undefined;
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: Buffer.alloc(64).toString('base64'),
      });

      const details = service.getStorageDetails();

      expect(details.AZURE_STORAGE_ACCOUNT!.exists).toBe(false);
      (config as any).accountName = originalConfig.accountName;
    });

    it('should return container name value when exists', () => {
      mockGetStorageCredentials.mockReturnValue({
        accountName: 'testaccount',
        accountKey: Buffer.alloc(64).toString('base64'),
      });

      const details = service.getStorageDetails();

      expect(details.RECORDINGS_CONTAINER_NAME!.exists).toBe(true);
      expect(details.RECORDINGS_CONTAINER_NAME!.value).toBe('recordings');
      expect(details.SNAPSHOT_CONTAINER_NAME!.exists).toBe(true);
      expect(details.SNAPSHOT_CONTAINER_NAME!.value).toBe('snapshots');
    });
  });
});

