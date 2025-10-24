/**
 * @fileoverview Tests for CameraStartFailureSchema
 * @description Tests for camera start failure validation schema
 */

import { cameraStartFailureSchema, CameraStartFailureRequest } from '../../../../../shared/domain/schemas/CameraStartFailureSchema';
import { AttemptResult } from '../../../../../shared/domain/interfaces/CameraFailureTypes';

// Mock CameraFailureStage enum since it's not available in test environment
const CameraFailureStage = {
  Permission: 'Permission',
  Enumerate: 'Enumerate',
  TrackCreate: 'TrackCreate',
  LiveKitConnect: 'LiveKitConnect',
  Publish: 'Publish',
  Unknown: 'Unknown'
} as const;

describe('CameraStartFailureSchema', () => {
  describe('cameraStartFailureSchema', () => {
    it('should validate with minimal required data', () => {
      const validData = {
        stage: CameraFailureStage.Permission
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate with all optional fields', () => {
      const validData = {
        stage: CameraFailureStage.Permission,
        errorName: 'TestError',
        errorMessage: 'Test error message',
        deviceCount: 5,
        devicesSnapshot: [
          {
            label: 'Test Device',
            deviceId: 'device-123',
            groupId: 'group-456',
            vendorId: '1234',
            productId: '5678'
          }
        ],
        attempts: [
          {
            label: 'Test Attempt',
            deviceId: 'device-123',
            result: AttemptResult.NotReadableError,
            errorName: 'AttemptError',
            errorMessage: 'Attempt failed'
          }
        ],
        metadata: {
          customField: 'customValue',
          timestamp: 1234567890
        }
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate with null values in devicesSnapshot', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [
          {
            label: null,
            deviceId: null,
            groupId: null,
            vendorId: '1234',
            productId: '5678'
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with null values in attempts', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        attempts: [
          {
            label: null,
            deviceId: null,
            result: AttemptResult.NotReadableError,
            errorName: 'TestError',
            errorMessage: 'Test message'
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with empty arrays', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [],
        attempts: []
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with maximum allowed array sizes', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: Array(15).fill({
          label: 'Test Device',
          deviceId: 'device-123',
          groupId: 'group-456',
          vendorId: '1234',
          productId: '5678'
        }),
        attempts: Array(20).fill({
          label: 'Test Attempt',
          deviceId: 'device-123',
          result: AttemptResult.NotReadableError,
          errorName: 'TestError',
          errorMessage: 'Test message'
        })
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing stage', () => {
      const invalidData = {
        errorName: 'TestError'
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid stage', () => {
      const invalidData = {
        stage: 'INVALID_STAGE' as any
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject null stage', () => {
      const invalidData = {
        stage: null
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject undefined stage', () => {
      const invalidData = {
        stage: undefined
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long errorName', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        errorName: 'a'.repeat(101)
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long errorMessage', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        errorMessage: 'a'.repeat(1001)
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative deviceCount', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        deviceCount: -1
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer deviceCount', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        deviceCount: 1.5
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many devicesSnapshot', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: Array(16).fill({
          label: 'Test Device',
          deviceId: 'device-123'
        })
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many attempts', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        attempts: Array(21).fill({
          result: AttemptResult.NotReadableError
        })
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long device label', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [
          {
            label: 'a'.repeat(201),
            deviceId: 'device-123'
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long deviceId', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [
          {
            label: 'Test Device',
            deviceId: 'a'.repeat(257)
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long groupId', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [
          {
            label: 'Test Device',
            deviceId: 'device-123',
            groupId: 'a'.repeat(257)
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long vendorId', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [
          {
            label: 'Test Device',
            deviceId: 'device-123',
            vendorId: 'a'.repeat(9)
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long productId', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        devicesSnapshot: [
          {
            label: 'Test Device',
            deviceId: 'device-123',
            productId: 'a'.repeat(9)
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid attempt result', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        attempts: [
          {
            result: 'INVALID_RESULT' as any
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long attempt errorName', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        attempts: [
          {
            result: AttemptResult.NotReadableError,
            errorName: 'a'.repeat(101)
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long attempt errorMessage', () => {
      const invalidData = {
        stage: CameraFailureStage.Enumerate,
        attempts: [
          {
            result: AttemptResult.NotReadableError,
            errorMessage: 'a'.repeat(501)
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject null input', () => {
      const result = cameraStartFailureSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined input', () => {
      const result = cameraStartFailureSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject string input', () => {
      const result = cameraStartFailureSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should reject number input', () => {
      const result = cameraStartFailureSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should reject boolean input', () => {
      const result = cameraStartFailureSchema.safeParse(true);
      expect(result.success).toBe(false);
    });

    it('should reject array input', () => {
      const result = cameraStartFailureSchema.safeParse([]);
      expect(result.success).toBe(false);
    });
  });

  describe('CameraStartFailureRequest type', () => {
    it('should have correct type structure', () => {
      const request: CameraStartFailureRequest = {
        stage: CameraFailureStage.Enumerate,
        errorName: 'TestError',
        errorMessage: 'Test error message',
        deviceCount: 5,
        devicesSnapshot: [
          {
            label: 'Test Device',
            deviceId: 'device-123',
            groupId: 'group-456',
            vendorId: '1234',
            productId: '5678'
          }
        ],
        attempts: [
          {
            label: 'Test Attempt',
            deviceId: 'device-123',
            result: AttemptResult.NotReadableError,
            errorName: 'AttemptError',
            errorMessage: 'Attempt failed'
          }
        ],
        metadata: {
          customField: 'customValue'
        }
      };

      expect(request).toBeDefined();
      expect(request.stage).toBe('Enumerate');
    });

    it('should accept minimal data', () => {
      const request: CameraStartFailureRequest = {
        stage: CameraFailureStage.Enumerate
      };

      expect(request).toBeDefined();
      expect(request.stage).toBe('Enumerate');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        errorName: '',
        errorMessage: '',
        devicesSnapshot: [
          {
            label: '',
            deviceId: '',
            groupId: '',
            vendorId: '',
            productId: ''
          }
        ],
        attempts: [
          {
            label: '',
            deviceId: '',
            result: AttemptResult.NotReadableError,
            errorName: '',
            errorMessage: ''
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle special characters', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        errorName: 'Error!@#$%^&*()',
        errorMessage: 'Error with special chars: !@#$%^&*()',
        devicesSnapshot: [
          {
            label: 'Device with émojis 🎥',
            deviceId: 'device-123-émoji',
            groupId: 'group-456-émoji',
            vendorId: '1234',
            productId: '5678'
          }
        ],
        attempts: [
          {
            label: 'Attempt with émojis 🎥',
            deviceId: 'device-123-émoji',
            result: AttemptResult.NotReadableError,
            errorName: 'Error!@#$%^&*()',
            errorMessage: 'Error with special chars: !@#$%^&*()'
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        errorName: '错误名称',
        errorMessage: '错误消息：设备启动失败',
        devicesSnapshot: [
          {
            label: '设备名称',
            deviceId: '设备ID-123',
            groupId: '组ID-456',
            vendorId: '1234',
            productId: '5678'
          }
        ],
        attempts: [
          {
            label: '尝试名称',
            deviceId: '设备ID-123',
            result: AttemptResult.NotReadableError,
            errorName: '错误名称',
            errorMessage: '错误消息：尝试失败'
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('validation scenarios', () => {
    it('should validate device enumeration failure', () => {
      const validData = {
        stage: CameraFailureStage.Enumerate,
        errorName: 'NotAllowedError',
        errorMessage: 'Camera access denied by user',
        deviceCount: 0,
        devicesSnapshot: [],
        attempts: []
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate device selection failure', () => {
      const validData = {
        stage: CameraFailureStage.TrackCreate,
        errorName: 'NotFoundError',
        errorMessage: 'Selected device not found',
        deviceCount: 2,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'camera-1',
            groupId: 'group-1',
            vendorId: '1234',
            productId: '5678'
          },
          {
            label: 'Camera 2',
            deviceId: 'camera-2',
            groupId: 'group-2',
            vendorId: '1234',
            productId: '5678'
          }
        ],
        attempts: [
          {
            label: 'Camera 1',
            deviceId: 'camera-1',
            result: AttemptResult.NotReadableError,
            errorName: 'NotFoundError',
            errorMessage: 'Device not found'
          }
        ]
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate stream start failure', () => {
      const validData = {
        stage: CameraFailureStage.LiveKitConnect,
        errorName: 'NotReadableError',
        errorMessage: 'Camera is already in use by another application',
        deviceCount: 1,
        devicesSnapshot: [
          {
            label: 'Built-in Camera',
            deviceId: 'camera-builtin',
            groupId: 'group-builtin',
            vendorId: '1234',
            productId: '5678'
          }
        ],
        attempts: [
          {
            label: 'Built-in Camera',
            deviceId: 'camera-builtin',
            result: AttemptResult.NotReadableError,
            errorName: 'NotReadableError',
            errorMessage: 'Camera is already in use'
          }
        ],
        metadata: {
          browser: 'Chrome',
          version: '91.0.4472.124',
          platform: 'Windows'
        }
      };

      const result = cameraStartFailureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
