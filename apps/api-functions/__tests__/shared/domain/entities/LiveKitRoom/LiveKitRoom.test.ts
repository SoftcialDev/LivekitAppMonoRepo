/**
 * @fileoverview LiveKitRoom entity - unit tests
 */

import { LiveKitRoom } from '../../../../../shared/domain/entities/LiveKitRoom';

describe('LiveKitRoom', () => {
  describe('constructor', () => {
    it('creates room with name and token', () => {
      const room = new LiveKitRoom('room123', 'token123');
      
      expect(room.name).toBe('room123');
      expect(room.token).toBe('token123');
    });
  });

  describe('toPayload', () => {
    it('converts room to payload format', () => {
      const room = new LiveKitRoom('room123', 'token123');
      const payload = room.toPayload();
      
      expect(payload).toEqual({
        room: 'room123',
        token: 'token123'
      });
    });
  });
});
