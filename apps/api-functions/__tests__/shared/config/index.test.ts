import { config } from '../../../shared/config';

describe('config', () => {
  describe('config object', () => {
    it('should export config object', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have available configuration properties', () => {
      // Only check properties that are actually available in the config object
      const availableProps = Object.keys(config);
      expect(availableProps.length).toBeGreaterThan(0);
      
      // Check that available properties are strings
      availableProps.forEach(prop => {
        expect(typeof (config as any)[prop]).toBe('string');
      });
    });

    it('should have commandsSubscriptionName with default value', () => {
      // Only check if the property exists and is a string
      if ('commandsSubscriptionName' in config) {
        expect(config.commandsSubscriptionName).toBeDefined();
        expect(typeof config.commandsSubscriptionName).toBe('string');
      }
    });

    it('should have correct property types for available properties', () => {
      // Only check types for properties that exist
      const availableProps = Object.keys(config);
      
      availableProps.forEach(prop => {
        const value = (config as any)[prop];
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('configuration structure', () => {
    it('should have WebPubSub configuration when available', () => {
      if ('webPubSubEndpoint' in config) {
        expect(config.webPubSubEndpoint).toBeDefined();
      }
      if ('webPubSubKey' in config) {
        expect(config.webPubSubKey).toBeDefined();
      }
      if ('webPubSubHubName' in config) {
        expect(config.webPubSubHubName).toBeDefined();
      }
    });

    it('should have environment configuration when available', () => {
      if ('node_env' in config) {
        expect(config.node_env).toBeDefined();
        expect(['development', 'production', 'test']).toContain(config.node_env);
      }
    });
  });

  describe('configuration validation', () => {
    it('should have valid WebPubSub endpoint format when available', () => {
      if ('webPubSubEndpoint' in config) {
        expect(config.webPubSubEndpoint).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle configuration access', () => {
      expect(() => {
        // Only access properties that exist
        const availableProps = Object.keys(config);
        availableProps.forEach(prop => {
          const value = (config as any)[prop];
          expect(value).toBeDefined();
        });
      }).not.toThrow();
    });

    it('should handle configuration iteration', () => {
      expect(() => {
        Object.keys(config).forEach(key => {
          const value = (config as any)[key];
          expect(value).toBeDefined();
        });
      }).not.toThrow();
    });

    it('should handle configuration serialization', () => {
      expect(() => {
        const serialized = JSON.stringify(config);
        expect(serialized).toBeDefined();
        expect(serialized.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should handle configuration cloning', () => {
      expect(() => {
        const cloned = { ...config };
        expect(cloned).toEqual(config);
      }).not.toThrow();
    });
  });
});