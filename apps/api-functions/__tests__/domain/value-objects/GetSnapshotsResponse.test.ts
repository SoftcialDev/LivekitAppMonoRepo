import { GetSnapshotsResponse } from '../../../src/domain/value-objects/GetSnapshotsResponse';
import { SnapshotReport } from '../../../src/domain/value-objects/SnapshotReport';

describe('GetSnapshotsResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const reports: SnapshotReport[] = [];
      const response = new GetSnapshotsResponse(reports);
      const payload = response.toPayload();

      expect(payload).toEqual({
        reports: reports
      });
    });

    it('should include all snapshot reports in payload', () => {
      const mockReports: SnapshotReport[] = [
        { id: '1' } as SnapshotReport,
        { id: '2' } as SnapshotReport
      ];
      const response = new GetSnapshotsResponse(mockReports);
      const payload = response.toPayload();

      expect(payload.reports).toHaveLength(2);
      expect(payload.reports).toEqual(mockReports);
    });
  });
});






