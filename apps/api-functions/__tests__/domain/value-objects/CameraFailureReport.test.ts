import { CameraFailureReport } from '../../../src/domain/value-objects/CameraFailureReport';
import { CameraFailureStage } from '@prisma/client';
import { AttemptResult } from '../../../src/domain/enums/AttemptResult';

describe('CameraFailureReport', () => {
  describe('fromRequest', () => {
    it('should truncate device label to 200 characters', () => {
      const longLabel = 'a'.repeat(250);
      const request = {
        userAdId: 'user-id',
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [{ label: longLabel, deviceId: 'device-1' }]
      };

      const report = CameraFailureReport.fromRequest(request);
      expect(report.devicesSnapshot?.[0]?.label).toBe('a'.repeat(200));
    });

    it('should truncate deviceId to 256 characters', () => {
      const longDeviceId = 'b'.repeat(300);
      const request = {
        userAdId: 'user-id',
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [{ label: 'Device', deviceId: longDeviceId }]
      };

      const report = CameraFailureReport.fromRequest(request);
      // The fromRequest method maps deviceId to deviceId in the output, truncating to 256 chars
      const devices = report.devicesSnapshot as any;
      expect(devices?.[0]?.deviceId).toBe('b'.repeat(256));
    });

    it('should truncate attempt label to 200 characters', () => {
      const longLabel = 'c'.repeat(250);
      const request = {
        userAdId: 'user-id',
        stage: CameraFailureStage.Enumerate,
        attempts: [{ label: longLabel, deviceId: 'device-1', result: AttemptResult.OK }]
      };

      const report = CameraFailureReport.fromRequest(request);
      expect(report.attempts?.[0]?.label).toBe('c'.repeat(200));
    });

    it('should use default AttemptResult.Other when result is missing', () => {
      const request = {
        userAdId: 'user-id',
        stage: CameraFailureStage.Enumerate,
        attempts: [{ label: 'Attempt', deviceId: 'device-1', result: undefined as any }]
      };

      const report = CameraFailureReport.fromRequest(request);
      expect(report.attempts?.[0]?.result).toBe(AttemptResult.Other);
    });

    it('should limit devices to 15', () => {
      const request = {
        userAdId: 'user-id',
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: Array.from({ length: 20 }, (_, i) => ({
          label: `Device ${i}`,
          deviceId: `device-${i}`
        }))
      };

      const report = CameraFailureReport.fromRequest(request);
      expect(report.devicesSnapshot?.length).toBe(15);
    });

    it('should limit attempts to 20', () => {
      const request = {
        userAdId: 'user-id',
        stage: CameraFailureStage.Enumerate,
        attempts: Array.from({ length: 25 }, (_, i) => ({
          label: `Attempt ${i}`,
          deviceId: `device-${i}`,
          result: AttemptResult.OK
        }))
      };

      const report = CameraFailureReport.fromRequest(request);
      expect(report.attempts?.length).toBe(20);
    });
  });
});

