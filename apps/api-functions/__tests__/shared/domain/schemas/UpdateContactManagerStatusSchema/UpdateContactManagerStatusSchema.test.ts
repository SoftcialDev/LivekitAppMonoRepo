/**
 * @fileoverview UpdateContactManagerStatusSchema - unit tests
 * @summary Tests for UpdateContactManagerStatusSchema validation functionality
 * @description Validates UpdateContactManagerStatus request schema validation
 */

import { updateContactManagerStatusSchema, UpdateContactManagerStatusRequestPayload } from '../../../../../shared/domain/schemas/UpdateContactManagerStatusSchema';

describe('UpdateContactManagerStatusSchema', () => {
  describe('updateContactManagerStatusSchema', () => {
    it('should validate with Unavailable status', () => {
      const validData = {
        status: 'Unavailable' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Unavailable');
      }
    });

    it('should validate with Available status', () => {
      const validData = {
        status: 'Available' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate with OnBreak status', () => {
      const validData = {
        status: 'OnBreak' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('OnBreak');
      }
    });

    it('should validate with OnAnotherTask status', () => {
      const validData = {
        status: 'OnAnotherTask' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('OnAnotherTask');
      }
    });

    it('should validate with extra properties', () => {
      const validData = {
        status: 'Available' as const,
        extraProperty: 'value'
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate with nested properties', () => {
      const validData = {
        status: 'Available' as const,
        nested: {
          property: 'value'
        }
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate with array properties', () => {
      const validData = {
        status: 'Available' as const,
        arrayProperty: [1, 2, 3]
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate with function properties', () => {
      const validData = {
        status: 'Available' as const,
        functionProperty: () => {}
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate with boolean properties', () => {
      const validData = {
        status: 'Available' as const,
        booleanProperty: true
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate with number properties', () => {
      const validData = {
        status: 'Available' as const,
        numberProperty: 42
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate with string properties', () => {
      const validData = {
        status: 'Available' as const,
        stringProperty: 'test'
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should reject missing status', () => {
      const invalidData = {};

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null status', () => {
      const invalidData = {
        status: null
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined status', () => {
      const invalidData = {
        status: undefined
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid'
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe('Status must be one of: Unavailable, Available, OnBreak, OnAnotherTask');
      }
    });

    it('should reject empty string status', () => {
      const invalidData = {
        status: ''
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe('Status must be one of: Unavailable, Available, OnBreak, OnAnotherTask');
      }
    });

    it('should reject lowercase status', () => {
      const invalidData = {
        status: 'available'
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe('Status must be one of: Unavailable, Available, OnBreak, OnAnotherTask');
      }
    });

    it('should reject uppercase status', () => {
      const invalidData = {
        status: 'UNAVAILABLE'
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe('Status must be one of: Unavailable, Available, OnBreak, OnAnotherTask');
      }
    });

    it('should reject numeric status', () => {
      const invalidData = {
        status: 123
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean status', () => {
      const invalidData = {
        status: true
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array status', () => {
      const invalidData = {
        status: []
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject object status', () => {
      const invalidData = {
        status: {}
      };

      const result = updateContactManagerStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null input', () => {
      const result = updateContactManagerStatusSchema.safeParse(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined input', () => {
      const result = updateContactManagerStatusSchema.safeParse(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject string input', () => {
      const result = updateContactManagerStatusSchema.safeParse('string');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject number input', () => {
      const result = updateContactManagerStatusSchema.safeParse(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean input', () => {
      const result = updateContactManagerStatusSchema.safeParse(true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array input', () => {
      const result = updateContactManagerStatusSchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('UpdateContactManagerStatusRequestPayload type', () => {
    it('should have correct type structure', () => {
      const validData: UpdateContactManagerStatusRequestPayload = {
        status: 'Available'
      };

      expect(validData.status).toBe('Available');
    });

    it('should accept Unavailable status', () => {
      const validData: UpdateContactManagerStatusRequestPayload = {
        status: 'Unavailable'
      };

      expect(validData.status).toBe('Unavailable');
    });

    it('should accept OnBreak status', () => {
      const validData: UpdateContactManagerStatusRequestPayload = {
        status: 'OnBreak'
      };

      expect(validData.status).toBe('OnBreak');
    });

    it('should accept OnAnotherTask status', () => {
      const validData: UpdateContactManagerStatusRequestPayload = {
        status: 'OnAnotherTask'
      };

      expect(validData.status).toBe('OnAnotherTask');
    });
  });

  describe('edge cases', () => {
    it('should handle very long extra properties', () => {
      const validData = {
        status: 'Available' as const,
        extraProperty: 'a'.repeat(10000)
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should handle extra properties with special characters', () => {
      const validData = {
        status: 'Available' as const,
        'property-with-dashes': 'value',
        'property_with_underscores': 'value',
        'property.with.dots': 'value',
        'property with spaces': 'value'
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should handle extra properties with unicode characters', () => {
      const validData = {
        status: 'Available' as const,
        'propiedad-ñáéíóú': 'valor',
        '属性': '值',
        'свойство': 'значение'
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should handle extra properties with circular references', () => {
      const circularObject: any = {};
      circularObject.self = circularObject;

      const validData = {
        status: 'Available' as const,
        circularProperty: circularObject
      };

      const result = updateContactManagerStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate contact manager status update to Available', () => {
      const requestData = {
        status: 'Available' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });

    it('should validate contact manager status update to Unavailable', () => {
      const requestData = {
        status: 'Unavailable' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Unavailable');
      }
    });

    it('should validate contact manager status update to OnBreak', () => {
      const requestData = {
        status: 'OnBreak' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('OnBreak');
      }
    });

    it('should validate contact manager status update to OnAnotherTask', () => {
      const requestData = {
        status: 'OnAnotherTask' as const
      };

      const result = updateContactManagerStatusSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('OnAnotherTask');
      }
    });

    it('should validate contact manager status update with extra data', () => {
      const requestData = {
        status: 'Available' as const,
        timestamp: Date.now(),
        metadata: { source: 'mobile' }
      };

      const result = updateContactManagerStatusSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Available');
      }
    });
  });
});

