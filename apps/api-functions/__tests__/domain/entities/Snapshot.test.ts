import { Snapshot } from '../../../src/domain/entities/Snapshot';
import { SnapshotReason } from '../../../src/domain/enums/SnapshotReason';

describe('Snapshot', () => {
  const baseProps = {
    id: 'snapshot-id',
    supervisorId: 'supervisor-id',
    psoId: 'pso-id',
    reason: SnapshotReason.PERFORMANCE,
    takenAt: new Date('2024-01-01T10:00:00Z'),
    imageUrl: 'https://example.com/image.jpg',
  };

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create Snapshot with required properties', () => {
      const snapshot = new Snapshot(baseProps);

      expect(snapshot.id).toBe(baseProps.id);
      expect(snapshot.supervisorId).toBe(baseProps.supervisorId);
      expect(snapshot.psoId).toBe(baseProps.psoId);
      expect(snapshot.reason).toBe(baseProps.reason);
      expect(snapshot.takenAt).toBe(baseProps.takenAt);
      expect(snapshot.imageUrl).toBe(baseProps.imageUrl);
    });

    it('should set description to null when not provided', () => {
      const snapshot = new Snapshot(baseProps);
      expect(snapshot.description).toBeNull();
    });

    it('should set provided description', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        description: 'Test description',
      });
      expect(snapshot.description).toBe('Test description');
    });

    it('should set supervisor when provided', () => {
      const supervisor = { fullName: 'Supervisor Name' };
      const snapshot = new Snapshot({
        ...baseProps,
        supervisor,
      });
      expect(snapshot.supervisor).toEqual(supervisor);
    });

    it('should set pso when provided', () => {
      const pso = { fullName: 'PSO Name', email: 'pso@example.com' };
      const snapshot = new Snapshot({
        ...baseProps,
        pso,
      });
      expect(snapshot.pso).toEqual(pso);
    });
  });

  describe('fromPrisma', () => {
    it('should create Snapshot from Prisma model with reason', () => {
      const prismaSnapshot = {
        id: 'prisma-id',
        supervisorId: 'prisma-supervisor-id',
        psoId: 'prisma-pso-id',
        reason: {
          id: 'reason-id',
          label: 'Performance',
          code: 'PERFORMANCE',
        },
        description: 'Test description',
        takenAt: new Date('2024-01-01T09:00:00Z'),
        imageUrl: 'https://example.com/prisma-image.jpg',
        supervisor: { fullName: 'Supervisor Name' },
        pso: { fullName: 'PSO Name', email: 'pso@example.com' },
      };

      const snapshot = Snapshot.fromPrisma(prismaSnapshot);

      expect(snapshot.id).toBe(prismaSnapshot.id);
      expect(snapshot.supervisorId).toBe(prismaSnapshot.supervisorId);
      expect(snapshot.psoId).toBe(prismaSnapshot.psoId);
      expect(snapshot.reason).toBe('Performance');
      expect(snapshot.description).toBe(prismaSnapshot.description);
      expect(snapshot.takenAt).toBe(prismaSnapshot.takenAt);
      expect(snapshot.imageUrl).toBe(prismaSnapshot.imageUrl);
    });

    it('should create Snapshot from Prisma model with null reason', () => {
      const prismaSnapshot = {
        id: 'prisma-id',
        supervisorId: 'prisma-supervisor-id',
        psoId: 'prisma-pso-id',
        reason: null,
        description: null,
        takenAt: new Date('2024-01-01T09:00:00Z'),
        imageUrl: 'https://example.com/prisma-image.jpg',
        supervisor: null,
        pso: null,
      };

      const snapshot = Snapshot.fromPrisma(prismaSnapshot);

      expect(snapshot.reason).toBe('');
      expect(snapshot.supervisor).toBeUndefined();
      expect(snapshot.pso).toBeUndefined();
    });

    it('should create Snapshot from Prisma model with supervisor having null fullName', () => {
      const prismaSnapshot = {
        id: 'prisma-id',
        supervisorId: 'prisma-supervisor-id',
        psoId: 'prisma-pso-id',
        reason: { id: 'reason-id', label: 'Test', code: 'TEST' },
        description: null,
        takenAt: new Date('2024-01-01T09:00:00Z'),
        imageUrl: 'https://example.com/prisma-image.jpg',
        supervisor: { fullName: null },
        pso: null,
      };

      const snapshot = Snapshot.fromPrisma(prismaSnapshot);

      expect(snapshot.supervisor).toBeUndefined();
    });

    it('should create Snapshot from Prisma model with pso having null fullName', () => {
      const prismaSnapshot = {
        id: 'prisma-id',
        supervisorId: 'prisma-supervisor-id',
        psoId: 'prisma-pso-id',
        reason: { id: 'reason-id', label: 'Test', code: 'TEST' },
        description: null,
        takenAt: new Date('2024-01-01T09:00:00Z'),
        imageUrl: 'https://example.com/prisma-image.jpg',
        supervisor: null,
        pso: { fullName: null, email: 'pso@example.com' },
      };

      const snapshot = Snapshot.fromPrisma(prismaSnapshot);

      expect(snapshot.pso).toBeUndefined();
    });
  });

  describe('requiresDescription', () => {
    it('should return true when reason is OTHER', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.OTHER,
      });
      expect(snapshot.requiresDescription()).toBe(true);
    });

    it('should return false when reason is not OTHER', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.PERFORMANCE,
      });
      expect(snapshot.requiresDescription()).toBe(false);
    });
  });

  describe('hasValidDescription', () => {
    it('should return true when reason is OTHER and description is provided', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.OTHER,
        description: 'Valid description',
      });
      expect(snapshot.hasValidDescription()).toBe(true);
    });

    it('should return false when reason is OTHER and description is null', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.OTHER,
        description: null,
      });
      expect(snapshot.hasValidDescription()).toBe(false);
    });

    it('should return false when reason is OTHER and description is empty', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.OTHER,
        description: '',
      });
      expect(snapshot.hasValidDescription()).toBe(false);
    });

    it('should return false when reason is OTHER and description is only whitespace', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.OTHER,
        description: '   ',
      });
      expect(snapshot.hasValidDescription()).toBe(false);
    });

    it('should return true when reason is not OTHER', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.PERFORMANCE,
        description: null,
      });
      expect(snapshot.hasValidDescription()).toBe(true);
    });

    it('should return true when reason is not OTHER even with empty description', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.PERFORMANCE,
        description: '',
      });
      expect(snapshot.hasValidDescription()).toBe(true);
    });
  });

  describe('getAge', () => {
    it('should return age in milliseconds', () => {
      const takenAt = new Date('2024-01-01T11:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      const age = snapshot.getAge();
      expect(age).toBe(60 * 60 * 1000); // 1 hour in milliseconds
    });
  });

  describe('getAgeInMinutes', () => {
    it('should return age in minutes', () => {
      const takenAt = new Date('2024-01-01T11:05:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      const ageInMinutes = snapshot.getAgeInMinutes();
      expect(ageInMinutes).toBe(55); // 55 minutes
    });

    it('should floor the age in minutes', () => {
      const takenAt = new Date('2024-01-01T11:05:30Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      const ageInMinutes = snapshot.getAgeInMinutes();
      expect(ageInMinutes).toBe(54); // Should floor to 54 minutes
    });
  });

  describe('getAgeInHours', () => {
    it('should return age in hours', () => {
      const takenAt = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T13:30:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      const ageInHours = snapshot.getAgeInHours();
      expect(ageInHours).toBe(3); // 3 hours (floored)
    });
  });

  describe('getAgeInDays', () => {
    it('should return age in days', () => {
      const takenAt = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-04T10:00:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      const ageInDays = snapshot.getAgeInDays();
      expect(ageInDays).toBe(3); // 3 days
    });
  });

  describe('isRecent', () => {
    it('should return true when snapshot is within maxMinutes', () => {
      const takenAt = new Date('2024-01-01T11:30:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      expect(snapshot.isRecent(60)).toBe(true);
    });

    it('should return false when snapshot exceeds maxMinutes', () => {
      const takenAt = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      expect(snapshot.isRecent(60)).toBe(false);
    });

    it('should use default maxMinutes of 60', () => {
      const takenAt = new Date('2024-01-01T11:30:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());

      const snapshot = new Snapshot({
        ...baseProps,
        takenAt,
      });

      expect(snapshot.isRecent()).toBe(true);
    });
  });

  describe('isOtherReason', () => {
    it('should return true when reason is OTHER', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.OTHER,
      });
      expect(snapshot.isOtherReason()).toBe(true);
    });

    it('should return false when reason is not OTHER', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.PERFORMANCE,
      });
      expect(snapshot.isOtherReason()).toBe(false);
    });
  });

  describe('getReasonLabel', () => {
    it('should return correct label for ATTENTIVENESS_ALERTNESS', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.ATTENTIVENESS_ALERTNESS,
      });
      expect(snapshot.getReasonLabel()).toBe('Attentiveness / Alertness');
    });

    it('should return correct label for TIME_ATTENDANCE', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.TIME_ATTENDANCE,
      });
      expect(snapshot.getReasonLabel()).toBe('Time & Attendance (unjustified absence, no show, late)');
    });

    it('should return correct label for PERFORMANCE', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.PERFORMANCE,
      });
      expect(snapshot.getReasonLabel()).toBe('Performance');
    });

    it('should return correct label for COMPLIANCE', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.COMPLIANCE,
      });
      expect(snapshot.getReasonLabel()).toBe('Compliance (Background / HIPAA / Uniform / Other)');
    });

    it('should return correct label for PROFESSIONAL_APPEARANCE', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.PROFESSIONAL_APPEARANCE,
      });
      expect(snapshot.getReasonLabel()).toBe('Professional appearance and demeanor');
    });

    it('should return correct label for OTHER', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: SnapshotReason.OTHER,
      });
      expect(snapshot.getReasonLabel()).toBe('Other');
    });

    it('should return the reason string when no label is found', () => {
      const snapshot = new Snapshot({
        ...baseProps,
        reason: 'UNKNOWN_REASON' as any,
      });
      expect(snapshot.getReasonLabel()).toBe('UNKNOWN_REASON');
    });
  });
});






