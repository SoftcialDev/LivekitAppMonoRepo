import { HealthStatus } from '../../../src/domain/enums/HealthStatus';
import { EnvCheck } from '../../../src/domain/types/HealthCheckTypes';

describe('HealthCheckDomainService', () => {
  let service: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    process.env.LIVEKIT_API_URL = 'https://livekit.example.com';
    process.env.LIVEKIT_API_KEY = 'lk_key';
    process.env.LIVEKIT_API_SECRET = 'lk_secret';
    process.env.SERVICE_BUS_CONNECTION = 'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=test';
    process.env.WEBPUBSUB_ENDPOINT = 'https://wps.example.com';
    process.env.WEBPUBSUB_KEY = 'wps_key';
    process.env.WEBPUBSUB_HUB = 'hub';
    process.env.AZURE_TENANT_ID = '11111111-1111-1111-1111-111111111111';
    process.env.AZURE_CLIENT_ID = '22222222-2222-2222-2222-222222222222';
    process.env.AZURE_CLIENT_SECRET = 'client-secret';
    process.env.SERVICE_BUS_TOPIC_NAME = 'topic';
    process.env.NODE_ENV = 'test';
    process.env.ADMINS_GROUP_ID = 'admin-group';
    process.env.SUPERVISORS_GROUP_ID = 'supervisor-group';
    process.env.EMPLOYEES_GROUP_ID = 'employee-group';
    process.env.AZURE_AD_API_IDENTIFIER_URI = 'https://api.example.com';
    process.env.SERVICE_PRINCIPAL_OBJECT_ID = 'principal-id';
    process.env.CONTACT_MANAGER_GROUP_ID = 'cm-group';
    process.env.COMMANDS_SUBSCRIPTION_NAME = 'commands';
    process.env.AZURE_STORAGE_ACCOUNT = 'storage-account';
    process.env.AZURE_STORAGE_KEY = 'storage-key';
    process.env.SUPER_ADMIN_GROUP_ID = 'super-admin-group';
    process.env.SNAPSHOT_CONTAINER_NAME = 'snapshots';
    process.env.RECORDINGS_CONTAINER_NAME = 'recordings';
    
    jest.resetModules();
    const { HealthCheckDomainService } = require('../../../src/domain/services/HealthCheckDomainService');
    service = new HealthCheckDomainService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('validateEnvironmentVariables', () => {
    it('should return OK status when all mapped keys are present', () => {
      const result = service.validateEnvironmentVariables();

      const mappedKeys = [
        'DATABASE_URL',
        'LIVEKIT_API_URL',
        'LIVEKIT_API_KEY',
        'LIVEKIT_API_SECRET',
        'SERVICE_BUS_CONNECTION',
        'WEBPUBSUB_ENDPOINT',
        'WEBPUBSUB_KEY',
        'WEBPUBSUB_HUB',
        'AZURE_TENANT_ID',
        'AZURE_CLIENT_ID',
        'AZURE_CLIENT_SECRET',
        'SERVICE_BUS_TOPIC_NAME',
        'NODE_ENV',
        'AZURE_AD_API_IDENTIFIER_URI',
        'SERVICE_PRINCIPAL_OBJECT_ID',
        'AZURE_STORAGE_ACCOUNT',
        'AZURE_STORAGE_KEY',
      ];
      
      const missingMappedKeys = result.missingKeys.filter(key => mappedKeys.includes(key));
      expect(missingMappedKeys).toEqual([]);
      
      const unmappedKeys = ['ADMINS_GROUP_ID', 'SUPERVISORS_GROUP_ID', 'EMPLOYEES_GROUP_ID', 'CONTACT_MANAGER_GROUP_ID', 'COMMANDS_SUBSCRIPTION_NAME', 'SUPER_ADMIN_GROUP_ID'];
      const missingUnmappedKeys = result.missingKeys.filter(key => unmappedKeys.includes(key));
      expect(missingUnmappedKeys.length).toBeGreaterThan(0);
      expect(result.status).toBe(HealthStatus.FAIL);
    });

    it('should include presentKeys when storageDetails provided', () => {
      const storageDetails: EnvCheck['storageDetails'] = {
        AZURE_STORAGE_ACCOUNT: {
          exists: true,
          preview: 'test',
        },
      };

      const result = service.validateEnvironmentVariables(storageDetails);

      expect(result.presentKeys).toBeDefined();
      expect(result.storageDetails).toBe(storageDetails);
    });

    it('should not include presentKeys when storageDetails not provided', () => {
      const result = service.validateEnvironmentVariables();

      expect(result.presentKeys).toBeUndefined();
    });
  });

  describe('determineOverallStatus', () => {
    it('should return FAIL when env status is FAIL', () => {
      const result = service.determineOverallStatus(HealthStatus.FAIL);

      expect(result).toBe(HealthStatus.FAIL);
    });

    it('should return FAIL when database status is FAIL', () => {
      const result = service.determineOverallStatus(HealthStatus.OK, HealthStatus.FAIL);

      expect(result).toBe(HealthStatus.FAIL);
    });

    it('should return OK when both statuses are OK', () => {
      const result = service.determineOverallStatus(HealthStatus.OK, HealthStatus.OK);

      expect(result).toBe(HealthStatus.OK);
    });

    it('should return OK when env is OK and database status is undefined', () => {
      const result = service.determineOverallStatus(HealthStatus.OK);

      expect(result).toBe(HealthStatus.OK);
    });
  });

  describe('getRequiredEnvKeys', () => {
    it('should return array of required environment variable keys', () => {
      const keys = service.getRequiredEnvKeys();

      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('DATABASE_URL');
      expect(keys).toContain('LIVEKIT_API_URL');
    });
  });
});

