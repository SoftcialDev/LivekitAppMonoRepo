import { CommandAcknowledgmentStatus } from '../../../src/domain/enums/CommandAcknowledgmentStatus';

describe('CommandAcknowledgmentStatus', () => {
  it('should have PENDING status', () => {
    expect(CommandAcknowledgmentStatus.PENDING).toBe('PENDING');
  });

  it('should have ACKNOWLEDGED status', () => {
    expect(CommandAcknowledgmentStatus.ACKNOWLEDGED).toBe('ACKNOWLEDGED');
  });

  it('should have FAILED status', () => {
    expect(CommandAcknowledgmentStatus.FAILED).toBe('FAILED');
  });

  it('should have exactly 3 status values', () => {
    const statusValues = Object.values(CommandAcknowledgmentStatus);
    expect(statusValues).toHaveLength(3);
  });

  it('should have all string values', () => {
    const statusValues = Object.values(CommandAcknowledgmentStatus);
    statusValues.forEach(status => {
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
    });
  });

  it('should have unique values', () => {
    const statusValues = Object.values(CommandAcknowledgmentStatus);
    const uniqueValues = new Set(statusValues);
    expect(uniqueValues.size).toBe(statusValues.length);
  });

  it('should match expected status values', () => {
    expect(CommandAcknowledgmentStatus).toEqual({
      PENDING: 'PENDING',
      ACKNOWLEDGED: 'ACKNOWLEDGED',
      FAILED: 'FAILED',
    });
  });
});






