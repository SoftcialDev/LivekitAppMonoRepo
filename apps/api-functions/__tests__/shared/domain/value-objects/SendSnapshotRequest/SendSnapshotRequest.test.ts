import { SendSnapshotRequest } from '../../../../../shared/domain/value-objects/SendSnapshotRequest';
import { SendSnapshotParams } from '../../../../../shared/domain/schemas/SendSnapshotSchema';

describe('SendSnapshotRequest', () => {
  const mockReasonId = '550e8400-e29b-41d4-a716-446655440000';

  describe('constructor', () => {
    it('should create request with all properties', () => {
      const request = new SendSnapshotRequest(
        'caller-123',
        'pso@example.com',
        mockReasonId,
        undefined,
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      );

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@example.com');
      expect(request.reasonId).toBe(mockReasonId);
      expect(request.description).toBeUndefined();
      expect(request.imageBase64).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    });

    it('should handle different caller ID formats', () => {
      const reasonId1 = '550e8400-e29b-41d4-a716-446655440001';
      const reasonId2 = '550e8400-e29b-41d4-a716-446655440002';
      const request1 = new SendSnapshotRequest('caller-abc', 'pso1@example.com', reasonId1, undefined, 'base64data1');
      const request2 = new SendSnapshotRequest('caller-xyz', 'pso2@example.com', reasonId2, undefined, 'base64data2');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different PSO email formats', () => {
      const reasonId = '550e8400-e29b-41d4-a716-446655440003';
      const request1 = new SendSnapshotRequest('caller-123', 'pso1@example.com', reasonId, undefined, 'base64data');
      const request2 = new SendSnapshotRequest('caller-123', 'pso2@company.com', reasonId, undefined, 'base64data');

      expect(request1.psoEmail).toBe('pso1@example.com');
      expect(request2.psoEmail).toBe('pso2@company.com');
    });

    it('should handle different reason ID formats', () => {
      const reasonId1 = '550e8400-e29b-41d4-a716-446655440004';
      const reasonId2 = '550e8400-e29b-41d4-a716-446655440005';
      const request1 = new SendSnapshotRequest('caller-123', 'pso@example.com', reasonId1, undefined, 'base64data');
      const request2 = new SendSnapshotRequest('caller-123', 'pso@example.com', reasonId2, undefined, 'base64data');

      expect(request1.reasonId).toBe(reasonId1);
      expect(request2.reasonId).toBe(reasonId2);
    });

    it('should handle different image base64 formats', () => {
      const base64Data1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64Data2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      
      const request1 = new SendSnapshotRequest('caller-123', 'pso@example.com', mockReasonId, undefined, base64Data1);
      const request2 = new SendSnapshotRequest('caller-123', 'pso@example.com', mockReasonId, undefined, base64Data2);

      expect(request1.imageBase64).toBe(base64Data1);
      expect(request2.imageBase64).toBe(base64Data2);
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new SendSnapshotRequest(uuid, 'pso@example.com', mockReasonId, undefined, 'base64data');

      expect(request.callerId).toBe(uuid);
    });
  });

  describe('fromBody', () => {
    it('should create request from valid caller ID and params', () => {
      const params: SendSnapshotParams = {
        psoEmail: 'pso@example.com',
        reasonId: mockReasonId,
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };
      const request = SendSnapshotRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@example.com');
      expect(request.reasonId).toBe(mockReasonId);
      expect(request.imageBase64).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    });

    it('should handle different caller ID formats from body', () => {
      const params: SendSnapshotParams = {
        psoEmail: 'pso@example.com',
        reasonId: mockReasonId,
        imageBase64: 'base64data'
      };
      const request1 = SendSnapshotRequest.fromBody('caller-abc', params);
      const request2 = SendSnapshotRequest.fromBody('caller-xyz', params);

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different PSO email formats from body', () => {
      const params1: SendSnapshotParams = {
        psoEmail: 'pso1@example.com',
        reasonId: mockReasonId,
        imageBase64: 'base64data'
      };
      const params2: SendSnapshotParams = {
        psoEmail: 'pso2@company.com',
        reasonId: mockReasonId,
        imageBase64: 'base64data'
      };

      const request1 = SendSnapshotRequest.fromBody('caller-123', params1);
      const request2 = SendSnapshotRequest.fromBody('caller-123', params2);

      expect(request1.psoEmail).toBe('pso1@example.com');
      expect(request2.psoEmail).toBe('pso2@company.com');
    });

    it('should handle different reason ID formats from body', () => {
      const reasonId1 = '550e8400-e29b-41d4-a716-446655440006';
      const reasonId2 = '550e8400-e29b-41d4-a716-446655440007';
      const params1: SendSnapshotParams = {
        psoEmail: 'pso@example.com',
        reasonId: reasonId1,
        imageBase64: 'base64data'
      };
      const params2: SendSnapshotParams = {
        psoEmail: 'pso@example.com',
        reasonId: reasonId2,
        imageBase64: 'base64data'
      };

      const request1 = SendSnapshotRequest.fromBody('caller-123', params1);
      const request2 = SendSnapshotRequest.fromBody('caller-123', params2);

      expect(request1.reasonId).toBe(reasonId1);
      expect(request2.reasonId).toBe(reasonId2);
    });

    it('should handle UUID format caller ID from body', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const params: SendSnapshotParams = {
        psoEmail: 'pso@example.com',
        reasonId: mockReasonId,
        imageBase64: 'base64data'
      };
      const request = SendSnapshotRequest.fromBody(uuid, params);

      expect(request.callerId).toBe(uuid);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new SendSnapshotRequest(
        'caller-123',
        'pso@example.com',
        mockReasonId,
        undefined,
        'base64data'
      );

      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller';
      }).toThrow();

      expect(() => {
        (request as any).psoEmail = 'modified@pso.com';
      }).toThrow();

      expect(() => {
        (request as any).reasonId = 'modified-reason-id';
      }).toThrow();

      expect(() => {
        (request as any).description = 'Modified description';
      }).toThrow();

      expect(() => {
        (request as any).imageBase64 = 'modified-base64';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new SendSnapshotRequest('', 'pso@example.com', mockReasonId, undefined, 'base64data');

      expect(request.callerId).toBe('');
      expect(request.psoEmail).toBe('pso@example.com');
    });

    it('should handle empty PSO email string', () => {
      const request = new SendSnapshotRequest('caller-123', '', mockReasonId, undefined, 'base64data');

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('');
    });

    it('should handle empty image base64 string', () => {
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', mockReasonId, undefined, '');

      expect(request.imageBase64).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new SendSnapshotRequest(longId, 'pso@example.com', mockReasonId, undefined, 'base64data');

      expect(request.callerId).toBe(longId);
    });

    it('should handle long PSO email string', () => {
      const longEmail = 'pso-' + 'a'.repeat(1000) + '@example.com';
      const request = new SendSnapshotRequest('caller-123', longEmail, mockReasonId, undefined, 'base64data');

      expect(request.psoEmail).toBe(longEmail);
    });

    it('should handle long image base64 string', () => {
      const longBase64 = 'a'.repeat(100000);
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', mockReasonId, undefined, longBase64);

      expect(request.imageBase64).toBe(longBase64);
    });

    it('should handle special characters in all fields', () => {
      const specialCallerId = 'caller-123!@#$%^&*()';
      const specialPsoEmail = 'pso+test@example.com';
      const specialBase64 = 'base64!@#$%^&*()';
      
      const request = new SendSnapshotRequest(specialCallerId, specialPsoEmail, mockReasonId, undefined, specialBase64);

      expect(request.callerId).toBe(specialCallerId);
      expect(request.psoEmail).toBe(specialPsoEmail);
      expect(request.imageBase64).toBe(specialBase64);
    });

    it('should handle description when provided', () => {
      const request = new SendSnapshotRequest(
        'caller-123',
        'pso@example.com',
        mockReasonId,
        'Custom description for snapshot',
        'base64data'
      );

      expect(request.reasonId).toBe(mockReasonId);
      expect(request.description).toBe('Custom description for snapshot');
    });
  });

  describe('type safety', () => {
    it('should accept string for all properties', () => {
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', mockReasonId, undefined, 'base64data');
      
      expect(typeof request.callerId).toBe('string');
      expect(typeof request.psoEmail).toBe('string');
      expect(typeof request.reasonId).toBe('string');
      expect(typeof request.imageBase64).toBe('string');
    });

    it('should accept SendSnapshotParams interface', () => {
      const params: SendSnapshotParams = {
        psoEmail: 'pso@example.com',
        reasonId: mockReasonId,
        imageBase64: 'base64data'
      };
      const request = SendSnapshotRequest.fromBody('caller-123', params);

      expect(request).toBeInstanceOf(SendSnapshotRequest);
      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@example.com');
      expect(request.reasonId).toBe(mockReasonId);
      expect(request.imageBase64).toBe('base64data');
    });
  });

  describe('validation scenarios', () => {
    it('should handle compliance snapshot scenario', () => {
      const request = new SendSnapshotRequest(
        'supervisor-123',
        'pso@example.com',
        mockReasonId,
        undefined,
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      );

      expect(request.callerId).toBe('supervisor-123');
      expect(request.psoEmail).toBe('pso@example.com');
      expect(request.reasonId).toBe(mockReasonId);
    });

    it('should handle performance snapshot scenario', () => {
      const request = new SendSnapshotRequest(
        'admin-456',
        'pso2@example.com',
        mockReasonId,
        undefined,
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      );

      expect(request.callerId).toBe('admin-456');
      expect(request.psoEmail).toBe('pso2@example.com');
      expect(request.reasonId).toBe(mockReasonId);
    });

    it('should handle time attendance snapshot scenario', () => {
      const request = new SendSnapshotRequest(
        'inspector-789',
        'pso3@example.com',
        mockReasonId,
        undefined,
        'base64-routine-inspection-data'
      );

      expect(request.callerId).toBe('inspector-789');
      expect(request.psoEmail).toBe('pso3@example.com');
      expect(request.reasonId).toBe(mockReasonId);
    });

    it('should handle Azure AD Object ID scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new SendSnapshotRequest(
        azureObjectId,
        'pso@example.com',
        mockReasonId,
        undefined,
        'azure-base64-data'
      );

      expect(request.callerId).toBe(azureObjectId);
      expect(request.psoEmail).toBe('pso@example.com');
      expect(request.reasonId).toBe(mockReasonId);
    });

    it('should handle snapshot from body scenario with description', () => {
      const params: SendSnapshotParams = {
        psoEmail: 'body-pso@example.com',
        reasonId: mockReasonId,
        description: 'Custom description for snapshot',
        imageBase64: 'body-base64-data'
      };
      const request = SendSnapshotRequest.fromBody('body-caller-123', params);

      expect(request.callerId).toBe('body-caller-123');
      expect(request.psoEmail).toBe('body-pso@example.com');
      expect(request.reasonId).toBe(mockReasonId);
      expect(request.description).toBe('Custom description for snapshot');
      expect(request.imageBase64).toBe('body-base64-data');
    });
  });
});
