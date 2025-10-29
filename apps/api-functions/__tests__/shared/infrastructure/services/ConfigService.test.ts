/**
 * @fileoverview Tests for ConfigService
 * @description Tests for configuration service
 */

const { ConfigService } = require('../../../../shared/infrastructure/services/ConfigService');

describe('ConfigService', () => {
  let configService: any;

  beforeEach(() => {
    configService = new ConfigService();
    // Clear environment variables
    delete process.env.LIVEKIT_API_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
    delete process.env.WEBPUBSUB_ENDPOINT;
    delete process.env.WEBPUBSUB_ACCESS_KEY;
    delete process.env.WEBPUBSUB_HUB_NAME;
  });

  describe('getLiveKitApiUrl', () => {
    it('should return environment variable value when set', () => {
      process.env.LIVEKIT_API_URL = 'wss://test-livekit-server.com';
      
      const result = configService.getLiveKitApiUrl();
      
      expect(result).toBe('wss://test-livekit-server.com');
    });

    it('should return default value when environment variable is not set', () => {
      const result = configService.getLiveKitApiUrl();
      
      expect(result).toBe('wss://your-livekit-server.com');
    });
  });

  describe('getLiveKitApiKey', () => {
    it('should return environment variable value when set', () => {
      process.env.LIVEKIT_API_KEY = 'test-api-key';
      
      const result = configService.getLiveKitApiKey();
      
      expect(result).toBe('test-api-key');
    });

    it('should return empty string when environment variable is not set', () => {
      const result = configService.getLiveKitApiKey();
      
      expect(result).toBe('');
    });
  });

  describe('getLiveKitApiSecret', () => {
    it('should return environment variable value when set', () => {
      process.env.LIVEKIT_API_SECRET = 'test-api-secret';
      
      const result = configService.getLiveKitApiSecret();
      
      expect(result).toBe('test-api-secret');
    });

    it('should return empty string when environment variable is not set', () => {
      const result = configService.getLiveKitApiSecret();
      
      expect(result).toBe('');
    });
  });

  describe('getWebPubSubEndpoint', () => {
    it('should return environment variable value when set', () => {
      process.env.WEBPUBSUB_ENDPOINT = 'https://test-endpoint.webpubsub.azure.com';
      
      const result = configService.getWebPubSubEndpoint();
      
      expect(result).toBe('https://test-endpoint.webpubsub.azure.com');
    });

    it('should return empty string when environment variable is not set', () => {
      const result = configService.getWebPubSubEndpoint();
      
      expect(result).toBe('');
    });
  });

  describe('getWebPubSubAccessKey', () => {
    it('should return environment variable value when set', () => {
      process.env.WEBPUBSUB_ACCESS_KEY = 'test-access-key';
      
      const result = configService.getWebPubSubAccessKey();
      
      expect(result).toBe('test-access-key');
    });

    it('should return empty string when environment variable is not set', () => {
      const result = configService.getWebPubSubAccessKey();
      
      expect(result).toBe('');
    });
  });

  describe('getWebPubSubHubName', () => {
    it('should return environment variable value when set', () => {
      process.env.WEBPUBSUB_HUB_NAME = 'test-hub';
      
      const result = configService.getWebPubSubHubName();
      
      expect(result).toBe('test-hub');
    });

    it('should return empty string when environment variable is not set', () => {
      const result = configService.getWebPubSubHubName();
      
      expect(result).toBe('');
    });
  });

  describe('integration scenarios', () => {
    it('should handle all environment variables set', () => {
      process.env.LIVEKIT_API_URL = 'wss://test-livekit-server.com';
      process.env.LIVEKIT_API_KEY = 'test-api-key';
      process.env.LIVEKIT_API_SECRET = 'test-api-secret';
      process.env.WEBPUBSUB_ENDPOINT = 'https://test-endpoint.webpubsub.azure.com';
      process.env.WEBPUBSUB_ACCESS_KEY = 'test-access-key';
      process.env.WEBPUBSUB_HUB_NAME = 'test-hub';

      expect(configService.getLiveKitApiUrl()).toBe('wss://test-livekit-server.com');
      expect(configService.getLiveKitApiKey()).toBe('test-api-key');
      expect(configService.getLiveKitApiSecret()).toBe('test-api-secret');
      expect(configService.getWebPubSubEndpoint()).toBe('https://test-endpoint.webpubsub.azure.com');
      expect(configService.getWebPubSubAccessKey()).toBe('test-access-key');
      expect(configService.getWebPubSubHubName()).toBe('test-hub');
    });

    it('should handle all environment variables not set', () => {
      expect(configService.getLiveKitApiUrl()).toBe('wss://your-livekit-server.com');
      expect(configService.getLiveKitApiKey()).toBe('');
      expect(configService.getLiveKitApiSecret()).toBe('');
      expect(configService.getWebPubSubEndpoint()).toBe('');
      expect(configService.getWebPubSubAccessKey()).toBe('');
      expect(configService.getWebPubSubHubName()).toBe('');
    });
  });
});
