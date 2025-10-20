import {
  User,
  PendingCommand,
  StreamingSessionHistory,
  Presence,
  ContactManagerProfile,
  AuditLog
} from '../../../../shared/domain/entities';

describe('Domain Entities Index', () => {
  it('should export User entity', () => {
    expect(User).toBeDefined();
    expect(typeof User).toBe('function');
  });

  it('should export PendingCommand entity', () => {
    expect(PendingCommand).toBeDefined();
    expect(typeof PendingCommand).toBe('function');
  });

  it('should export StreamingSessionHistory entity', () => {
    expect(StreamingSessionHistory).toBeDefined();
    expect(typeof StreamingSessionHistory).toBe('function');
  });

  it('should export Presence entity', () => {
    expect(Presence).toBeDefined();
    expect(typeof Presence).toBe('function');
  });

  it('should export ContactManagerProfile entity', () => {
    expect(ContactManagerProfile).toBeDefined();
    expect(typeof ContactManagerProfile).toBe('function');
  });

  it('should export AuditLog entity', () => {
    expect(AuditLog).toBeDefined();
    expect(typeof AuditLog).toBe('function');
  });

  it('should export all entities as constructors', () => {
    const entities = [
      User,
      PendingCommand,
      StreamingSessionHistory,
      Presence,
      ContactManagerProfile,
      AuditLog
    ];

    entities.forEach(entity => {
      expect(entity).toBeDefined();
      expect(typeof entity).toBe('function');
    });
  });

  it('should allow importing individual entities', () => {
    // Test that we can import individual entities
    const { User: UserEntity } = require('../../../../shared/domain/entities');
    const { PendingCommand: PendingCommandEntity } = require('../../../../shared/domain/entities');
    const { StreamingSessionHistory: StreamingSessionHistoryEntity } = require('../../../../shared/domain/entities');
    const { Presence: PresenceEntity } = require('../../../../shared/domain/entities');
    const { ContactManagerProfile: ContactManagerProfileEntity } = require('../../../../shared/domain/entities');
    const { AuditLog: AuditLogEntity } = require('../../../../shared/domain/entities');

    expect(UserEntity).toBe(User);
    expect(PendingCommandEntity).toBe(PendingCommand);
    expect(StreamingSessionHistoryEntity).toBe(StreamingSessionHistory);
    expect(PresenceEntity).toBe(Presence);
    expect(ContactManagerProfileEntity).toBe(ContactManagerProfile);
    expect(AuditLogEntity).toBe(AuditLog);
  });

  it('should allow importing all entities at once', () => {
    const allEntities = require('../../../../shared/domain/entities');
    
    expect(allEntities.User).toBe(User);
    expect(allEntities.PendingCommand).toBe(PendingCommand);
    expect(allEntities.StreamingSessionHistory).toBe(StreamingSessionHistory);
    expect(allEntities.Presence).toBe(Presence);
    expect(allEntities.ContactManagerProfile).toBe(ContactManagerProfile);
    expect(allEntities.AuditLog).toBe(AuditLog);
  });

  it('should have correct entity names', () => {
    expect(User.name).toBe('User');
    expect(PendingCommand.name).toBe('PendingCommand');
    expect(StreamingSessionHistory.name).toBe('StreamingSessionHistory');
    expect(Presence.name).toBe('Presence');
    expect(ContactManagerProfile.name).toBe('ContactManagerProfile');
    expect(AuditLog.name).toBe('AuditLog');
  });
});
