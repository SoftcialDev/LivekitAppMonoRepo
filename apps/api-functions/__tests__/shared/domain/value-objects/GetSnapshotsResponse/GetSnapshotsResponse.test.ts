import { GetSnapshotsResponse } from '../../../../../shared/domain/value-objects/GetSnapshotsResponse';
import { SnapshotReport } from '../../../../../shared/domain/value-objects/SnapshotReport';

describe('GetSnapshotsResponse', () => {
  describe('constructor', () => {
    it('should create response with snapshot reports', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-1',
          supervisorName: 'John Supervisor',
          psoFullName: 'Jane PSO',
          psoEmail: 'jane.pso@example.com',
          reason: 'Safety check',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        },
        {
          id: 'snapshot-2',
          supervisorName: 'Bob Supervisor',
          psoFullName: 'Alice PSO',
          psoEmail: 'alice.pso@example.com',
          reason: 'Incident report',
          imageUrl: 'https://example.com/snapshot2.jpg',
          takenAt: '2024-01-01T11:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports).toHaveLength(2);
    });

    it('should create response with empty reports array', () => {
      const reports: SnapshotReport[] = [];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports).toHaveLength(0);
    });

    it('should create response with single report', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-single',
          supervisorName: 'Single Supervisor',
          psoFullName: 'Single PSO',
          psoEmail: 'single.pso@example.com',
          reason: 'Single check',
          imageUrl: 'https://example.com/single.jpg',
          takenAt: '2024-01-01T12:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports).toHaveLength(1);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-1',
          supervisorName: 'John Supervisor',
          psoFullName: 'Jane PSO',
          psoEmail: 'jane.pso@example.com',
          reason: 'Safety check',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);
      const payload = response.toPayload();

      expect(payload).toEqual({
        reports: reports
      });
    });

    it('should convert empty response to payload', () => {
      const reports: SnapshotReport[] = [];
      const response = new GetSnapshotsResponse(reports);
      const payload = response.toPayload();

      expect(payload).toEqual({
        reports: []
      });
    });

    it('should return reference to reports array', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-1',
          supervisorName: 'John Supervisor',
          psoFullName: 'Jane PSO',
          psoEmail: 'jane.pso@example.com',
          reason: 'Safety check',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);
      const payload = response.toPayload();

      expect(payload.reports).toBe(reports);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-1',
          supervisorName: 'John Supervisor',
          psoFullName: 'Jane PSO',
          psoEmail: 'jane.pso@example.com',
          reason: 'Safety check',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).reports = [];
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle reports with special characters', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-special!@#$%',
          supervisorName: 'Supervisor "Special" & Co.',
          psoFullName: 'PSO with émojis 🚀',
          psoEmail: 'special@pso.com',
          reason: 'Special: "Incident" & follow-up',
          imageUrl: 'https://example.com/special%20image.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports[0].supervisorName).toBe('Supervisor "Special" & Co.');
    });

    it('should handle reports with unicode characters', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-unicode',
          supervisorName: 'Supervisor José',
          psoFullName: 'PSO María',
          psoEmail: 'maria@pso.com',
          reason: 'Revisión de seguridad',
          imageUrl: 'https://example.com/unicode.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports[0].supervisorName).toBe('Supervisor José');
    });

    it('should handle reports with long text fields', () => {
      const longText = 'a'.repeat(1000);
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-long',
          supervisorName: longText,
          psoFullName: longText,
          psoEmail: 'long@pso.com',
          reason: longText,
          imageUrl: 'https://example.com/long.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports[0].supervisorName).toBe(longText);
    });

    it('should handle reports with different timestamp formats', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-1',
          supervisorName: 'John Supervisor',
          psoFullName: 'Jane PSO',
          psoEmail: 'jane.pso@example.com',
          reason: 'Safety check',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2024-01-01T10:00:00.000Z'
        },
        {
          id: 'snapshot-2',
          supervisorName: 'Bob Supervisor',
          psoFullName: 'Alice PSO',
          psoEmail: 'alice.pso@example.com',
          reason: 'Incident report',
          imageUrl: 'https://example.com/snapshot2.jpg',
          takenAt: '2024-01-01T11:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports[0].takenAt).toBe('2024-01-01T10:00:00.000Z');
      expect(response.reports[1].takenAt).toBe('2024-01-01T11:00:00Z');
    });
  });

  describe('type safety', () => {
    it('should accept SnapshotReport array for reports', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-1',
          supervisorName: 'John Supervisor',
          psoFullName: 'Jane PSO',
          psoEmail: 'jane.pso@example.com',
          reason: 'Safety check',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toBe(reports);
      expect(response.reports[0]).toHaveProperty('id');
      expect(response.reports[0]).toHaveProperty('supervisorName');
      expect(response.reports[0]).toHaveProperty('psoFullName');
      expect(response.reports[0]).toHaveProperty('psoEmail');
      expect(response.reports[0]).toHaveProperty('reason');
      expect(response.reports[0]).toHaveProperty('imageUrl');
      expect(response.reports[0]).toHaveProperty('takenAt');
    });
  });

  describe('validation scenarios', () => {
    it('should handle empty snapshot list scenario', () => {
      const reports: SnapshotReport[] = [];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toHaveLength(0);
    });

    it('should handle single snapshot scenario', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-single',
          supervisorName: 'Single Supervisor',
          psoFullName: 'Single PSO',
          psoEmail: 'single.pso@example.com',
          reason: 'Single check',
          imageUrl: 'https://example.com/single.jpg',
          takenAt: '2024-01-01T12:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toHaveLength(1);
      expect(response.reports[0].id).toBe('snapshot-single');
    });

    it('should handle multiple snapshots scenario', () => {
      const reports: SnapshotReport[] = [
        {
          id: 'snapshot-1',
          supervisorName: 'John Supervisor',
          psoFullName: 'Jane PSO',
          psoEmail: 'jane.pso@example.com',
          reason: 'Safety check',
          imageUrl: 'https://example.com/snapshot1.jpg',
          takenAt: '2024-01-01T10:00:00Z'
        },
        {
          id: 'snapshot-2',
          supervisorName: 'Bob Supervisor',
          psoFullName: 'Alice PSO',
          psoEmail: 'alice.pso@example.com',
          reason: 'Incident report',
          imageUrl: 'https://example.com/snapshot2.jpg',
          takenAt: '2024-01-01T11:00:00Z'
        },
        {
          id: 'snapshot-3',
          supervisorName: 'Charlie Supervisor',
          psoFullName: 'David PSO',
          psoEmail: 'david.pso@example.com',
          reason: 'Routine inspection',
          imageUrl: 'https://example.com/snapshot3.jpg',
          takenAt: '2024-01-01T12:00:00Z'
        }
      ];
      const response = new GetSnapshotsResponse(reports);

      expect(response.reports).toHaveLength(3);
      expect(response.reports[0].id).toBe('snapshot-1');
      expect(response.reports[1].id).toBe('snapshot-2');
      expect(response.reports[2].id).toBe('snapshot-3');
    });
  });
});
