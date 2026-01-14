import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { AzureKeyCredential } from '@azure/core-auth';
import webPubSubClient, { getWebPubSubClient, resetWebPubSubClient } from '../../../src/infrastructure/messaging/WebPubSubClient';
import { config } from '../../../src/config';

jest.mock('@azure/web-pubsub');
jest.mock('@azure/core-auth');
jest.mock('../../../src/config', () => ({
  config: {
    webPubSubEndpoint: 'https://test.webpubsub.azure.com',
    webPubSubKey: 'test-key',
    webPubSubHubName: 'test-hub',
  },
}));

const MockWebPubSubServiceClient = WebPubSubServiceClient as jest.MockedClass<typeof WebPubSubServiceClient>;
const MockAzureKeyCredential = AzureKeyCredential as jest.MockedClass<typeof AzureKeyCredential>;

describe('WebPubSubClient', () => {
  let mockClient: jest.Mocked<WebPubSubServiceClient>;
  let mockCredential: jest.Mocked<AzureKeyCredential>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetWebPubSubClient();

    mockCredential = {} as any;
    mockClient = {
      group: jest.fn(),
    } as any;

    MockAzureKeyCredential.mockImplementation(() => mockCredential);
    MockWebPubSubServiceClient.mockImplementation(() => mockClient);
  });

  describe('getInstance', () => {
    it('should create WebPubSubServiceClient with config values', () => {
      Object.defineProperty(mockClient, 'group', {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });
      const client = getWebPubSubClient();
      const _ = client.group;

      expect(MockWebPubSubServiceClient).toHaveBeenCalledWith(
        'https://test.webpubsub.azure.com',
        mockCredential,
        'test-hub'
      );
      expect(MockAzureKeyCredential).toHaveBeenCalledWith('test-key');
      expect(client).toBeDefined();
    });

    it('should return same instance on subsequent calls', () => {
      Object.defineProperty(mockClient, 'group', {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });
      const client1 = getWebPubSubClient();
      const _1 = client1.group;
      const client2 = getWebPubSubClient();
      const _2 = client2.group;

      expect(client1).toBe(client2);
      expect(MockWebPubSubServiceClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    it('should reset singleton instance', () => {
      Object.defineProperty(mockClient, 'group', {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });
      const client1 = getWebPubSubClient();
      const _1 = client1.group;
      resetWebPubSubClient();
      const client2 = getWebPubSubClient();
      const _2 = client2.group;

      expect(MockWebPubSubServiceClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('default export', () => {
    it('should export WebPubSubServiceClient instance', () => {
      const client = webPubSubClient;

      expect(client).toBeDefined();
    });
  });

  describe('getWebPubSubClient', () => {
    it('should return WebPubSubServiceClient instance', () => {
      Object.defineProperty(mockClient, 'group', {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });
      const client = getWebPubSubClient();
      const _ = client.group;

      expect(client).toBeDefined();
      expect(MockWebPubSubServiceClient).toHaveBeenCalled();
    });
  });

  describe('resetWebPubSubClient', () => {
    it('should reset the client instance', () => {
      Object.defineProperty(mockClient, 'group', {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });
      const client1 = getWebPubSubClient();
      const _1 = client1.group;
      resetWebPubSubClient();
      const newClient = getWebPubSubClient();
      const _2 = newClient.group;

      expect(newClient).toBeDefined();
      expect(MockWebPubSubServiceClient).toHaveBeenCalledTimes(2);
    });
  });
});

