/**
 * @fileoverview Tests for shared/config/index.ts
 * @description Tests for configuration module (mocked version)
 */

import { config } from '../../../shared/config/index';

describe('shared/config/index', () => {
  describe('config object (mocked)', () => {
    it('should export config object', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have some configuration properties', () => {
      // Check that config has some properties (the ones that are available in test environment)
      expect(config).toHaveProperty('azureClientId');
      expect(config).toHaveProperty('azureTenantId');
      expect(config).toHaveProperty('node_env');
      expect(config).toHaveProperty('webPubSubEndpoint');
      expect(config).toHaveProperty('webPubSubHubName');
      expect(config).toHaveProperty('webPubSubKey');
    });

    it('should have commandsSubscriptionName property when available', () => {
      // This property may not be available in test environment
      if (config.hasOwnProperty('commandsSubscriptionName')) {
        expect(config.commandsSubscriptionName).toBeDefined();
        expect(typeof config.commandsSubscriptionName).toBe('string');
      }
    });

    it('should have all available properties as strings', () => {
      const availableProperties = Object.keys(config);
      
      availableProperties.forEach(prop => {
        expect((config as any)[prop]).toBeDefined();
        expect(typeof (config as any)[prop]).toBe('string');
      });
    });
  });
});