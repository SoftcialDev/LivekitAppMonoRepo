/**
 * @fileoverview Presence entity - unit tests
 */

import { Presence } from '../../../../../shared/domain/entities/Presence';
import { Status } from '../../../../../shared/domain/enums/Status';

describe('Presence', () => {
  const basePresenceData = {
    userId: 'user123',
    status: Status.Online,
    lastSeenAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z')
  };

  describe('constructor', () => {
    it('creates presence with all required properties', () => {
      const presence = new Presence(
        'user123',
        Status.Online,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(presence.userId).toBe('user123');
      expect(presence.status).toBe(Status.Online);
      expect(presence.lastSeenAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(presence.updatedAt).toEqual(new Date('2023-01-01T11:00:00Z'));
    });
  });

  describe('fromPrisma', () => {
    it('creates presence from Prisma data', () => {
      const prismaData = {
        userId: 'user123',
        status: 'online',
        lastSeenAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };

      const presence = Presence.fromPrisma(prismaData);
      
      expect(presence.userId).toBe('user123');
      expect(presence.status).toBe(Status.Online);
      expect(presence.lastSeenAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(presence.updatedAt).toEqual(new Date('2023-01-01T11:00:00Z'));
    });

    it('handles different status values', () => {
      const prismaData = {
        userId: 'user123',
        status: 'offline',
        lastSeenAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };

      const presence = Presence.fromPrisma(prismaData);
      expect(presence.status).toBe(Status.Offline);
    });
  });

  describe('toPayload', () => {
    it('converts presence to payload format', () => {
      const presence = new Presence(
        'user123',
        Status.Online,
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      const payload = presence.toPayload();
      
      expect(payload).toEqual({
        userId: 'user123',
        status: Status.Online,
        lastSeenAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      });
    });
  });
});
