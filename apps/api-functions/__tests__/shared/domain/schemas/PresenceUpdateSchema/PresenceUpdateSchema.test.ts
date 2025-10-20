/**
 * @fileoverview PresenceUpdateSchema - unit tests
 * @summary Tests for PresenceUpdateSchema validation functionality
 * @description Validates PresenceUpdate request schema validation
 */

import { presenceUpdateSchema, PresenceUpdateParams } from '../../../../../shared/domain/schemas/PresenceUpdateSchema';

describe('PresenceUpdateSchema', () => {
  describe('presenceUpdateSchema', () => {
    it('should validate with online status', () => {
      const validData = {
        status: 'online' as const
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate with offline status', () => {
      const validData = {
        status: 'offline' as const
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('offline');
      }
    });

    it('should validate with extra properties', () => {
      const validData = {
        status: 'online' as const,
        extraProperty: 'value'
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate with nested properties', () => {
      const validData = {
        status: 'online' as const,
        nested: {
          property: 'value'
        }
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate with array properties', () => {
      const validData = {
        status: 'online' as const,
        arrayProperty: [1, 2, 3]
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate with function properties', () => {
      const validData = {
        status: 'online' as const,
        functionProperty: () => {}
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate with boolean properties', () => {
      const validData = {
        status: 'online' as const,
        booleanProperty: true
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate with number properties', () => {
      const validData = {
        status: 'online' as const,
        numberProperty: 42
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate with string properties', () => {
      const validData = {
        status: 'online' as const,
        stringProperty: 'test'
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should reject missing status', () => {
      const invalidData = {};

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null status', () => {
      const invalidData = {
        status: null
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined status', () => {
      const invalidData = {
        status: undefined
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid'
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe("Status must be either 'online' or 'offline'");
      }
    });

    it('should reject empty string status', () => {
      const invalidData = {
        status: ''
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe("Status must be either 'online' or 'offline'");
      }
    });

    it('should reject numeric status', () => {
      const invalidData = {
        status: 123
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean status', () => {
      const invalidData = {
        status: true
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array status', () => {
      const invalidData = {
        status: []
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject object status', () => {
      const invalidData = {
        status: {}
      };

      const result = presenceUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null input', () => {
      const result = presenceUpdateSchema.safeParse(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined input', () => {
      const result = presenceUpdateSchema.safeParse(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject string input', () => {
      const result = presenceUpdateSchema.safeParse('string');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject number input', () => {
      const result = presenceUpdateSchema.safeParse(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean input', () => {
      const result = presenceUpdateSchema.safeParse(true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array input', () => {
      const result = presenceUpdateSchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('PresenceUpdateParams type', () => {
    it('should have correct type structure', () => {
      const validData: PresenceUpdateParams = {
        status: 'online'
      };

      expect(validData.status).toBe('online');
    });

    it('should accept offline status', () => {
      const validData: PresenceUpdateParams = {
        status: 'offline'
      };

      expect(validData.status).toBe('offline');
    });
  });

  describe('edge cases', () => {
    it('should handle very long extra properties', () => {
      const validData = {
        status: 'online' as const,
        extraProperty: 'a'.repeat(10000)
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should handle extra properties with special characters', () => {
      const validData = {
        status: 'online' as const,
        'property-with-dashes': 'value',
        'property_with_underscores': 'value',
        'property.with.dots': 'value',
        'property with spaces': 'value'
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should handle extra properties with unicode characters', () => {
      const validData = {
        status: 'online' as const,
        'propiedad-ñáéíóú': 'valor',
        '属性': '值',
        'свойство': 'значение'
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should handle extra properties with circular references', () => {
      const circularObject: any = {};
      circularObject.self = circularObject;

      const validData = {
        status: 'online' as const,
        circularProperty: circularObject
      };

      const result = presenceUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate online presence update request', () => {
      const requestData = {
        status: 'online' as const
      };

      const result = presenceUpdateSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });

    it('should validate offline presence update request', () => {
      const requestData = {
        status: 'offline' as const
      };

      const result = presenceUpdateSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('offline');
      }
    });

    it('should validate presence update request with extra data', () => {
      const requestData = {
        status: 'online' as const,
        timestamp: Date.now(),
        metadata: { source: 'mobile' }
      };

      const result = presenceUpdateSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('online');
      }
    });
  });
});

