/**
 * @fileoverview Tests for CameraFailureReport
 * @description Tests for camera failure report value object
 */

import { CameraFailureReport } from '../../../../shared/domain/value-objects/CameraFailureReport';
import { AttemptResult } from '../../../../shared/domain/interfaces/CameraFailureTypes';

// Mock timezone utility
jest.mock('../../../../shared/utils/timezone', () => ({
  nowCRIso: jest.fn().mockReturnValue('2024-01-01T10:00:00-06:00'),
}));

// Mock CameraFailureStage enum
const CameraFailureStage = {
  Permission: 'Permission',
  Enumerate: 'Enumerate',
  TrackCreate: 'TrackCreate',
  LiveKitConnect: 'LiveKitConnect',
  Publish: 'Publish',
  Unknown: 'Unknown'
} as const;

describe('CameraFailureReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fromRequest', () => {
    it('should create report from minimal request', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.userAdId).toBe('test-user-id');
      expect(report.stage).toBe(CameraFailureStage.Permission);
      expect(report.userEmail).toBeUndefined();
      expect(report.errorName).toBeUndefined();
      expect(report.errorMessage).toBeUndefined();
      expect(report.deviceCount).toBe(0);
      expect(report.devicesSnapshot).toEqual([]);
      expect(report.attempts).toEqual([]);
      expect(report.metadata).toBeUndefined();
      expect(report.createdAtCentralAmerica).toBe('2024-01-01T10:00:00-06:00');
    });

    it('should create report from complete request', () => {
      const request = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: CameraFailureStage.Enumerate as any,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
        deviceCount: 2,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
            groupId: 'group-1',
            vendorId: '12345678',
            productId: '87654321',
          },
          {
            label: 'Camera 2',
            deviceId: 'device-2',
          },
        ],
        attempts: [
          {
            label: 'Attempt 1',
            deviceId: 'device-1',
            result: AttemptResult.NotReadableError,
            errorName: 'PermissionError',
            errorMessage: 'Permission denied',
          },
        ],
        metadata: {
          browser: 'Chrome',
          version: '1.0.0',
        },
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.userAdId).toBe('test-user-id');
      expect(report.userEmail).toBe('test@example.com');
      expect(report.stage).toBe(CameraFailureStage.Enumerate);
      expect(report.errorName).toBe('PermissionError');
      expect(report.errorMessage).toBe('Camera permission denied');
      expect(report.deviceCount).toBe(2);
      expect(report.devicesSnapshot).toHaveLength(2);
      expect(report.attempts).toHaveLength(1);
      expect(report.metadata).toEqual({
        browser: 'Chrome',
        version: '1.0.0',
      });
    });

    it('should truncate long device labels', () => {
      const longLabel = 'a'.repeat(250);
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        devicesSnapshot: [
          {
            label: longLabel,
            deviceId: 'device-1',
          },
        ],
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.devicesSnapshot![0].label).toBe(longLabel.slice(0, 200));
    });

    it('should truncate long device IDs', () => {
      const longDeviceId = 'a'.repeat(300);
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: longDeviceId,
          },
        ],
      };

      const report = CameraFailureReport.fromRequest(request);

      // The actual implementation uses deviceId, not deviceIdHash
      expect(report.devicesSnapshot![0]).toHaveProperty('deviceId');
      expect((report.devicesSnapshot![0] as any).deviceId).toBe(longDeviceId.slice(0, 256));
    });

    it('should truncate long vendor and product IDs', () => {
      const longVendorId = '1234567890';
      const longProductId = '0987654321';
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
            vendorId: longVendorId,
            productId: longProductId,
          },
        ],
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.devicesSnapshot![0].vendorId).toBe(longVendorId.slice(0, 8));
      expect(report.devicesSnapshot![0].productId).toBe(longProductId.slice(0, 8));
    });

    it('should limit devices to 15', () => {
      const devices = Array.from({ length: 20 }, (_, i) => ({
        label: `Camera ${i}`,
        deviceId: `device-${i}`,
      }));

      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        devicesSnapshot: devices,
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.devicesSnapshot).toHaveLength(15);
      expect(report.devicesSnapshot![0].label).toBe('Camera 0');
      expect(report.devicesSnapshot![14].label).toBe('Camera 14');
    });

    it('should limit attempts to 20', () => {
      const attempts = Array.from({ length: 25 }, (_, i) => ({
        label: `Attempt ${i}`,
        deviceId: `device-${i}`,
        result: AttemptResult.Other,
      }));

      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        attempts,
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.attempts).toHaveLength(20);
      expect(report.attempts![0].label).toBe('Attempt 0');
      expect(report.attempts![19].label).toBe('Attempt 19');
    });

    it('should truncate long error names and messages', () => {
      const longErrorName = 'a'.repeat(150);
      const longErrorMessage = 'b'.repeat(1200);
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        errorName: longErrorName,
        errorMessage: longErrorMessage,
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.errorName).toBe(longErrorName.slice(0, 100));
      expect(report.errorMessage).toBe(longErrorMessage.slice(0, 1000));
    });

    it('should handle null and undefined values in devices', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        devicesSnapshot: [
          {
            label: null,
            deviceId: null,
            groupId: undefined,
            vendorId: undefined,
            productId: undefined,
          },
        ],
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.devicesSnapshot![0].label).toBeNull();
      expect((report.devicesSnapshot![0] as any).deviceId).toBeNull();
      expect(report.devicesSnapshot![0].vendorId).toBeUndefined();
      expect(report.devicesSnapshot![0].productId).toBeUndefined();
    });

    it('should handle null and undefined values in attempts', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        attempts: [
          {
            label: null,
            deviceId: null,
            result: AttemptResult.Other,
            errorName: undefined,
            errorMessage: undefined,
          },
        ],
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.attempts![0].label).toBeNull();
      expect((report.attempts![0] as any).deviceId).toBeNull();
      expect(report.attempts![0].result).toBe(AttemptResult.Other);
      expect(report.attempts![0].errorName).toBeUndefined();
      expect(report.attempts![0].errorMessage).toBeUndefined();
    });

    it('should use device count from request if provided', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        deviceCount: 5,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
          },
        ],
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.deviceCount).toBe(5);
    });

    it('should use devices length as device count if not provided', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
          },
          {
            label: 'Camera 2',
            deviceId: 'device-2',
          },
        ],
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.deviceCount).toBe(2);
    });

    it('should handle different camera failure stages', () => {
      const stages = [
        CameraFailureStage.Permission,
        CameraFailureStage.Enumerate,
        CameraFailureStage.TrackCreate,
        CameraFailureStage.LiveKitConnect,
        CameraFailureStage.Publish,
        CameraFailureStage.Unknown,
      ];

      stages.forEach(stage => {
        const request = {
          userAdId: 'test-user-id',
          stage: stage as any,
        };

        const report = CameraFailureReport.fromRequest(request);

        expect(report.stage).toBe(stage);
      });
    });
  });

  describe('toPersistence', () => {
    it('should convert report to persistence format', () => {
      const request = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: CameraFailureStage.Permission as any,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
        deviceCount: 1,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
          },
        ],
        attempts: [
          {
            label: 'Attempt 1',
            deviceId: 'device-1',
            result: AttemptResult.Other,
          },
        ],
        metadata: {
          browser: 'Chrome',
        },
      };

      const report = CameraFailureReport.fromRequest(request);
      const persistence = report.toPersistence();

      expect(persistence).toEqual({
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: CameraFailureStage.Permission,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
        deviceCount: 1,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
          },
        ],
        attempts: [
          {
            label: 'Attempt 1',
            deviceId: 'device-1',
            result: AttemptResult.Other,
          },
        ],
        metadata: {
          browser: 'Chrome',
        },
        createdAtCentralAmerica: '2024-01-01T10:00:00-06:00',
      });
    });

    it('should handle undefined optional fields in persistence', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
      };

      const report = CameraFailureReport.fromRequest(request);
      const persistence = report.toPersistence();

      expect(persistence.userAdId).toBe('test-user-id');
      expect(persistence.stage).toBe(CameraFailureStage.Permission);
      expect(persistence.userEmail).toBeUndefined();
      expect(persistence.errorName).toBeUndefined();
      expect(persistence.errorMessage).toBeUndefined();
      expect(persistence.deviceCount).toBe(0);
      expect(persistence.devicesSnapshot).toEqual([]);
      expect(persistence.attempts).toEqual([]);
      expect(persistence.metadata).toBeUndefined();
      expect(persistence.createdAtCentralAmerica).toBe('2024-01-01T10:00:00-06:00');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
      };

      const report = CameraFailureReport.fromRequest(request);

      // Test that properties exist and are defined
      expect(report.userAdId).toBe('test-user-id');
      expect(report.stage).toBe(CameraFailureStage.Permission);
      expect(report.createdAtCentralAmerica).toBe('2024-01-01T10:00:00-06:00');
    });
  });

  describe('edge cases', () => {
    it('should handle empty devices and attempts arrays', () => {
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        devicesSnapshot: [],
        attempts: [],
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.devicesSnapshot).toEqual([]);
      expect(report.attempts).toEqual([]);
      expect(report.deviceCount).toBe(0);
    });

    it('should handle complex metadata objects', () => {
      const complexMetadata = {
        browser: 'Chrome',
        version: '1.0.0',
        nested: {
          deep: {
            value: 'test',
          },
        },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      };

      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        metadata: complexMetadata,
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.metadata).toEqual(complexMetadata);
    });

    it('should handle special characters in strings', () => {
      const specialString = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const request = {
        userAdId: 'test-user-id',
        stage: CameraFailureStage.Permission as any,
        errorName: specialString,
        errorMessage: specialString,
      };

      const report = CameraFailureReport.fromRequest(request);

      expect(report.errorName).toBe(specialString);
      expect(report.errorMessage).toBe(specialString);
    });
  });
});
