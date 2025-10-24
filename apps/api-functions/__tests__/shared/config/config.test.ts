/**
 * @fileoverview Tests for shared/config/index.ts
 * @description Tests for configuration loading and validation
 */

describe('shared/config/index', () => {
  it('should export config object', () => {
    // Import the config module
    const config = require('../../../shared/config/index');

    // Verify config is exported
    expect(config).toBeDefined();
    expect(config.config).toBeDefined();
    expect(typeof config.config).toBe('object');
  });

  it('should have config properties defined', () => {
    // Import the config module
    const config = require('../../../shared/config/index');

    // Verify config object exists
    expect(config.config).toBeDefined();
    expect(typeof config.config).toBe('object');
  });

  it('should have node_env property', () => {
    // Import the config module
    const config = require('../../../shared/config/index');

    // Verify node_env exists
    expect(config.config.node_env).toBeDefined();
    expect(typeof config.config.node_env).toBe('string');
  });

  it('should have azureClientId property', () => {
    // Import the config module
    const config = require('../../../shared/config/index');

    // Verify azureClientId exists
    expect(config.config.azureClientId).toBeDefined();
    expect(typeof config.config.azureClientId).toBe('string');
  });
});
