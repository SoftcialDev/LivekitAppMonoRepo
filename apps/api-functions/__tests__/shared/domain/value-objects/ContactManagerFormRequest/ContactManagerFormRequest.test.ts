import { ContactManagerFormRequest } from '../../../../../shared/domain/value-objects/ContactManagerFormRequest';
import { FormType } from '../../../../../shared/domain/enums/FormType';

describe('ContactManagerFormRequest', () => {
  describe('constructor', () => {
    it('should create request with valid form type and data', () => {
      const formData = { name: 'John Doe', email: 'john@example.com' };
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData);

      expect(request.formType).toBe(FormType.DISCONNECTIONS);
      expect(request.formData).toEqual(formData);
      expect(request.timestamp).toBeInstanceOf(Date);
      expect(request.imageBase64).toBeUndefined();
    });

    it('should create request with image', () => {
      const formData = { name: 'John Doe', email: 'john@example.com' };
      const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD';
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData, imageBase64);

      expect(request.formType).toBe(FormType.DISCONNECTIONS);
      expect(request.formData).toEqual(formData);
      expect(request.imageBase64).toBe(imageBase64);
      expect(request.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for invalid form type', () => {
      const formData = { name: 'John Doe' };
      
      expect(() => {
        new ContactManagerFormRequest('INVALID_TYPE' as any, formData);
      }).toThrow('Invalid form type');
    });

    it('should throw error for null form type', () => {
      const formData = { name: 'John Doe' };
      
      expect(() => {
        new ContactManagerFormRequest(null as any, formData);
      }).toThrow('Invalid form type');
    });

    it('should throw error for undefined form type', () => {
      const formData = { name: 'John Doe' };
      
      expect(() => {
        new ContactManagerFormRequest(undefined as any, formData);
      }).toThrow('Invalid form type');
    });

    it('should throw error for null form data', () => {
      expect(() => {
        new ContactManagerFormRequest(FormType.DISCONNECTIONS, null as any);
      }).toThrow('Form data must be an object');
    });

    it('should throw error for undefined form data', () => {
      expect(() => {
        new ContactManagerFormRequest(FormType.DISCONNECTIONS, undefined as any);
      }).toThrow('Form data must be an object');
    });

    it('should throw error for non-object form data', () => {
      expect(() => {
        new ContactManagerFormRequest(FormType.DISCONNECTIONS, 'invalid' as any);
      }).toThrow('Form data must be an object');
    });
  });

  describe('fromBody', () => {
    it('should create request from valid body', () => {
      const body = {
        formType: FormType.DISCONNECTIONS,
        name: 'John Doe',
        email: 'john@example.com',
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD'
      };

      const request = ContactManagerFormRequest.fromBody(body);

      expect(request.formType).toBe(FormType.DISCONNECTIONS);
      expect(request.formData).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(request.imageBase64).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD');
    });

    it('should create request without image', () => {
      const body = {
        formType: FormType.DISCONNECTIONS,
        name: 'John Doe',
        email: 'john@example.com'
      };

      const request = ContactManagerFormRequest.fromBody(body);

      expect(request.formType).toBe(FormType.DISCONNECTIONS);
      expect(request.formData).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(request.imageBase64).toBeUndefined();
    });

    it('should throw error for null body', () => {
      expect(() => {
        ContactManagerFormRequest.fromBody(null);
      }).toThrow('Request body must be an object');
    });

    it('should throw error for undefined body', () => {
      expect(() => {
        ContactManagerFormRequest.fromBody(undefined);
      }).toThrow('Request body must be an object');
    });

    it('should throw error for non-object body', () => {
      expect(() => {
        ContactManagerFormRequest.fromBody('invalid');
      }).toThrow('Request body must be an object');
    });

    it('should throw error for invalid form type', () => {
      const body = {
        formType: 'INVALID_TYPE',
        name: 'John Doe'
      };

      expect(() => {
        ContactManagerFormRequest.fromBody(body);
      }).toThrow('Invalid form type');
    });

    it('should throw error for missing form type', () => {
      const body = {
        name: 'John Doe'
      };

      expect(() => {
        ContactManagerFormRequest.fromBody(body);
      }).toThrow('Invalid form type');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const formData = { name: 'John Doe', email: 'john@example.com' };
      const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD';
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData, imageBase64);
      
      const payload = request.toPayload();

      expect(payload).toEqual({
        formType: FormType.DISCONNECTIONS,
        formData: { name: 'John Doe', email: 'john@example.com' },
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD'
      });
    });

    it('should convert to payload without image', () => {
      const formData = { name: 'John Doe', email: 'john@example.com' };
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData);
      
      const payload = request.toPayload();

      expect(payload).toEqual({
        formType: FormType.DISCONNECTIONS,
        formData: { name: 'John Doe', email: 'john@example.com' },
        imageBase64: undefined
      });
    });

    it('should return immutable payload', () => {
      const formData = { name: 'John Doe' };
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData);
      const payload = request.toPayload();
      
      payload.formData.name = 'Modified';
      expect(request.formData.name).toBe('John Doe'); // Original should be unchanged
    });
  });

  describe('getFormDataForStorage', () => {
    it('should return form data without imageBase64', () => {
      const formData = { name: 'John Doe', email: 'john@example.com', imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD' };
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData);
      
      const storageData = request.getFormDataForStorage();

      expect(storageData).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(storageData.imageBase64).toBeUndefined();
    });

    it('should return all form data when no imageBase64', () => {
      const formData = { name: 'John Doe', email: 'john@example.com' };
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData);
      
      const storageData = request.getFormDataForStorage();

      expect(storageData).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { name: 'John Doe' });
      
      expect(() => {
        (request as any).formType = FormType.DISCONNECTIONS;
      }).toThrow();
      
      expect(() => {
        (request as any).formData = { modified: true };
      }).toThrow();
      
      expect(() => {
        (request as any).timestamp = new Date();
      }).toThrow();
    });

    it('should not modify original form data', () => {
      const originalData = { name: 'John Doe' };
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, originalData);
      
      originalData.name = 'Modified';
      expect(request.formData.name).toBe('John Doe'); // Should be unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle empty form data', () => {
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, {});
      expect(request.formData).toEqual({});
    });

    it('should handle complex form data', () => {
      const complexData = {
        name: 'John Doe',
        email: 'john@example.com',
        metadata: { source: 'web', version: '1.0' },
        array: [1, 2, 3],
        nested: { deep: { value: 'test' } }
      };
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, complexData);
      
      expect(request.formData).toEqual(complexData);
    });

    it('should handle different form types', () => {
      const formData = { name: 'John Doe' };
      
      const disconnectionsRequest = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData);
      const otherRequest = new ContactManagerFormRequest(FormType.DISCONNECTIONS, formData);
      
      expect(disconnectionsRequest.formType).toBe(FormType.DISCONNECTIONS);
      expect(otherRequest.formType).toBe(FormType.DISCONNECTIONS);
    });
  });
});