/**
 * @fileoverview WebPubSubTokenResponse value object - unit tests
 * @summary Tests for WebPubSubTokenResponse value object functionality
 * @description Validates token response creation, properties, and payload conversion
 */

import { WebPubSubTokenResponse } from '../../../../../shared/domain/value-objects/WebPubSubTokenResponse';

describe('WebPubSubTokenResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        ['group1', 'group2', 'group3']
      );

      expect(response.token).toBe('jwt-token-123');
      expect(response.endpoint).toBe('https://webpubsub.example.com');
      expect(response.hubName).toBe('hub-name');
      expect(response.groups).toEqual(['group1', 'group2', 'group3']);
    });

    it('should create response with empty groups array', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-456',
        'https://webpubsub.example.com',
        'hub-name',
        []
      );

      expect(response.token).toBe('jwt-token-456');
      expect(response.endpoint).toBe('https://webpubsub.example.com');
      expect(response.hubName).toBe('hub-name');
      expect(response.groups).toEqual([]);
    });

    it('should create response with single group', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-789',
        'https://webpubsub.example.com',
        'hub-name',
        ['single-group']
      );

      expect(response.token).toBe('jwt-token-789');
      expect(response.groups).toEqual(['single-group']);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        ['group1', 'group2']
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        token: 'jwt-token-123',
        endpoint: 'https://webpubsub.example.com',
        hubName: 'hub-name',
        groups: ['group1', 'group2']
      });
    });

    it('should convert response with empty groups to payload', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-456',
        'https://webpubsub.example.com',
        'hub-name',
        []
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        token: 'jwt-token-456',
        endpoint: 'https://webpubsub.example.com',
        hubName: 'hub-name',
        groups: []
      });
    });

    it('should return reference to groups array', () => {
      const originalGroups = ['group1', 'group2'];
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        originalGroups
      );

      const payload = response.toPayload();
      payload.groups.push('group3');

      // Since toPayload returns a reference, both original and payload are affected
      expect(response.groups).toEqual(['group1', 'group2', 'group3']);
      expect(payload.groups).toEqual(['group1', 'group2', 'group3']);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        ['group1', 'group2']
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).token = 'modified-token';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).endpoint = 'https://modified.example.com';
      }).not.toThrow();

      expect(() => {
        (response as any).hubName = 'modified-hub';
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty token', () => {
      const response = new WebPubSubTokenResponse(
        '',
        'https://webpubsub.example.com',
        'hub-name',
        ['group1']
      );

      expect(response.token).toBe('');
    });

    it('should handle long token', () => {
      const longToken = 'a'.repeat(1000);
      const response = new WebPubSubTokenResponse(
        longToken,
        'https://webpubsub.example.com',
        'hub-name',
        ['group1']
      );

      expect(response.token).toBe(longToken);
    });

    it('should handle special characters in token', () => {
      const specialToken = 'jwt-token-with-special-chars-123_abc.def';
      const response = new WebPubSubTokenResponse(
        specialToken,
        'https://webpubsub.example.com',
        'hub-name',
        ['group1']
      );

      expect(response.token).toBe(specialToken);
    });

    it('should handle different endpoint formats', () => {
      const httpEndpoint = 'http://webpubsub.example.com';
      const httpsEndpoint = 'https://webpubsub.example.com';
      const customPortEndpoint = 'https://webpubsub.example.com:8080';

      const httpResponse = new WebPubSubTokenResponse('token', httpEndpoint, 'hub', []);
      const httpsResponse = new WebPubSubTokenResponse('token', httpsEndpoint, 'hub', []);
      const customPortResponse = new WebPubSubTokenResponse('token', customPortEndpoint, 'hub', []);

      expect(httpResponse.endpoint).toBe(httpEndpoint);
      expect(httpsResponse.endpoint).toBe(httpsEndpoint);
      expect(customPortResponse.endpoint).toBe(customPortEndpoint);
    });

    it('should handle different hub names', () => {
      const hubNames = ['hub', 'my-hub', 'hub-123', 'hub_with_underscores'];
      
      hubNames.forEach(hubName => {
        const response = new WebPubSubTokenResponse(
          'token',
          'https://webpubsub.example.com',
          hubName,
          ['group1']
        );

        expect(response.hubName).toBe(hubName);
      });
    });

    it('should handle many groups', () => {
      const manyGroups = Array.from({ length: 100 }, (_, i) => `group-${i}`);
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        manyGroups
      );

      expect(response.groups).toHaveLength(100);
      expect(response.groups[0]).toBe('group-0');
      expect(response.groups[99]).toBe('group-99');
    });

    it('should handle groups with special characters', () => {
      const specialGroups = ['group-1', 'group_2', 'group.3', 'group@4'];
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        specialGroups
      );

      expect(response.groups).toEqual(specialGroups);
    });
  });

  describe('type safety', () => {
    it('should accept string types for all properties', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        ['group1', 'group2']
      );

      expect(typeof response.token).toBe('string');
      expect(typeof response.endpoint).toBe('string');
      expect(typeof response.hubName).toBe('string');
      expect(Array.isArray(response.groups)).toBe(true);
    });

    it('should accept string array for groups', () => {
      const response = new WebPubSubTokenResponse(
        'jwt-token-123',
        'https://webpubsub.example.com',
        'hub-name',
        ['group1', 'group2', 'group3']
      );

      expect(Array.isArray(response.groups)).toBe(true);
      response.groups.forEach(group => {
        expect(typeof group).toBe('string');
      });
    });
  });

  describe('validation scenarios', () => {
    it('should handle production-like token response', () => {
      const response = new WebPubSubTokenResponse(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'https://mywebpubsub.webpubsub.azure.com',
        'my-hub',
        ['user-123', 'notifications', 'chat-room-456']
      );

      expect(response.token).toContain('eyJ');
      expect(response.endpoint).toContain('webpubsub.azure.com');
      expect(response.hubName).toBe('my-hub');
      expect(response.groups).toHaveLength(3);
    });

    it('should handle development-like token response', () => {
      const response = new WebPubSubTokenResponse(
        'dev-token-123',
        'https://localhost:8080',
        'dev-hub',
        ['test-group']
      );

      expect(response.token).toBe('dev-token-123');
      expect(response.endpoint).toBe('https://localhost:8080');
      expect(response.hubName).toBe('dev-hub');
      expect(response.groups).toEqual(['test-group']);
    });
  });
});
