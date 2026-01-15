import { RecordingStartStatus } from '../../../src/domain/enums/RecordingStartStatus';

describe('RecordingStartStatus', () => {
  it('should have Started status', () => {
    expect(RecordingStartStatus.Started).toBe('STARTED');
  });

  it('should have Failed status', () => {
    expect(RecordingStartStatus.Failed).toBe('FAILED');
  });

  it('should have exactly 2 status values', () => {
    const statusValues = Object.values(RecordingStartStatus);
    expect(statusValues).toHaveLength(2);
  });
});

