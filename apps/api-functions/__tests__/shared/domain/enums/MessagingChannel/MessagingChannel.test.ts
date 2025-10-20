/**
 * @fileoverview MessagingChannel enum - unit tests
 * @summary Tests for messaging channel enumeration
 * @description Validates enum values, string representations, and channel functionality
 */

import { MessagingChannel } from '../../../../../shared/domain/enums/MessagingChannel';

describe('MessagingChannel', () => {
  describe('enum values', () => {
    it('should have WebSocket value', () => {
      expect(MessagingChannel.WebSocket).toBe('ws');
    });

    it('should have ServiceBus value', () => {
      expect(MessagingChannel.ServiceBus).toBe('bus');
    });
  });

  describe('enum properties', () => {
    it('should have correct number of enum values', () => {
      const enumValues = Object.values(MessagingChannel);
      expect(enumValues).toHaveLength(2);
    });

    it('should contain all expected values', () => {
      const enumValues = Object.values(MessagingChannel);
      expect(enumValues).toContain('ws');
      expect(enumValues).toContain('bus');
    });
  });

  describe('enum usage', () => {
    it('should be usable in conditional statements', () => {
      const channel = MessagingChannel.WebSocket;
      let result: string;

      if (channel === MessagingChannel.WebSocket) {
        result = 'websocket';
      } else if (channel === MessagingChannel.ServiceBus) {
        result = 'servicebus';
      } else {
        result = 'unknown';
      }

      expect(result).toBe('websocket');
    });

    it('should be comparable with string values', () => {
      expect(MessagingChannel.WebSocket === 'ws').toBe(true);
      expect(MessagingChannel.ServiceBus === 'bus').toBe(true);
    });

    it('should be usable in object keys', () => {
      const channelMap = {
        [MessagingChannel.WebSocket]: 'Real-time communication',
        [MessagingChannel.ServiceBus]: 'Reliable messaging'
      };

      expect(channelMap[MessagingChannel.WebSocket]).toBe('Real-time communication');
      expect(channelMap[MessagingChannel.ServiceBus]).toBe('Reliable messaging');
    });
  });

  describe('channel functionality', () => {
    it('should support channel selection logic', () => {
      const selectChannel = (isRealTime: boolean): MessagingChannel => {
        return isRealTime ? MessagingChannel.WebSocket : MessagingChannel.ServiceBus;
      };

      expect(selectChannel(true)).toBe(MessagingChannel.WebSocket);
      expect(selectChannel(false)).toBe(MessagingChannel.ServiceBus);
    });

    it('should support channel validation', () => {
      const isValidChannel = (channel: string): boolean => {
        return Object.values(MessagingChannel).includes(channel as MessagingChannel);
      };

      expect(isValidChannel('ws')).toBe(true);
      expect(isValidChannel('bus')).toBe(true);
      expect(isValidChannel('invalid')).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should accept valid enum values', () => {
      const validChannels: MessagingChannel[] = [
        MessagingChannel.WebSocket,
        MessagingChannel.ServiceBus
      ];

      expect(validChannels).toHaveLength(2);
    });

    it('should be serializable to JSON', () => {
      const channel = MessagingChannel.WebSocket;
      const json = JSON.stringify({ channel });
      const parsed = JSON.parse(json);

      expect(parsed.channel).toBe('ws');
    });
  });
});
