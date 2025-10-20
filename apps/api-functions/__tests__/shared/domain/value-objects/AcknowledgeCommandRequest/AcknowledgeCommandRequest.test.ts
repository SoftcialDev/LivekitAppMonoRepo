import { AcknowledgeCommandRequest } from '../../../../../shared/domain/value-objects/AcknowledgeCommandRequest';

describe('AcknowledgeCommandRequest', () => {
  describe('constructor', () => {
    it('should create request with valid command IDs', () => {
      const commandIds = ['cmd1', 'cmd2', 'cmd3'];
      const request = new AcknowledgeCommandRequest(commandIds);

      expect(request.commandIds).toEqual(['cmd1', 'cmd2', 'cmd3']);
      expect(request.timestamp).toBeInstanceOf(Date);
      expect(request.commandIds).not.toBe(commandIds); // Should be a copy
    });

    it('should throw error for empty array', () => {
      expect(() => {
        new AcknowledgeCommandRequest([]);
      }).toThrow('Command IDs array cannot be empty');
    });

    it('should throw error for null array', () => {
      expect(() => {
        new AcknowledgeCommandRequest(null as any);
      }).toThrow('Command IDs array cannot be empty');
    });

    it('should throw error for undefined array', () => {
      expect(() => {
        new AcknowledgeCommandRequest(undefined as any);
      }).toThrow('Command IDs array cannot be empty');
    });

    it('should throw error for empty string in array', () => {
      expect(() => {
        new AcknowledgeCommandRequest(['cmd1', '', 'cmd3']);
      }).toThrow('All command IDs must be non-empty strings');
    });

    it('should throw error for non-string in array', () => {
      expect(() => {
        new AcknowledgeCommandRequest(['cmd1', 123 as any, 'cmd3']);
      }).toThrow('All command IDs must be non-empty strings');
    });

    it('should throw error for null in array', () => {
      expect(() => {
        new AcknowledgeCommandRequest(['cmd1', null as any, 'cmd3']);
      }).toThrow('All command IDs must be non-empty strings');
    });
  });

  describe('fromBody', () => {
    it('should create request from valid body', () => {
      const body = { ids: ['cmd1', 'cmd2'] };
      const request = AcknowledgeCommandRequest.fromBody(body);

      expect(request.commandIds).toEqual(['cmd1', 'cmd2']);
      expect(request.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for null body', () => {
      expect(() => {
        AcknowledgeCommandRequest.fromBody(null);
      }).toThrow('Request body must be an object');
    });

    it('should throw error for undefined body', () => {
      expect(() => {
        AcknowledgeCommandRequest.fromBody(undefined);
      }).toThrow('Request body must be an object');
    });

    it('should throw error for non-object body', () => {
      expect(() => {
        AcknowledgeCommandRequest.fromBody('invalid');
      }).toThrow('Request body must be an object');
    });

    it('should throw error for missing ids', () => {
      const body = {};
      expect(() => {
        AcknowledgeCommandRequest.fromBody(body);
      }).toThrow('Request body must contain an array of command IDs');
    });

    it('should throw error for non-array ids', () => {
      const body = { ids: 'not-an-array' };
      expect(() => {
        AcknowledgeCommandRequest.fromBody(body);
      }).toThrow('Request body must contain an array of command IDs');
    });

    it('should throw error for empty ids array', () => {
      const body = { ids: [] };
      expect(() => {
        AcknowledgeCommandRequest.fromBody(body);
      }).toThrow('Command IDs array cannot be empty');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const commandIds = ['cmd1', 'cmd2', 'cmd3'];
      const request = new AcknowledgeCommandRequest(commandIds);
      const payload = request.toPayload();

      expect(payload).toEqual({
        ids: ['cmd1', 'cmd2', 'cmd3']
      });
      expect(payload.ids).not.toBe(commandIds); // Should be a copy
    });

    it('should return immutable payload', () => {
      const request = new AcknowledgeCommandRequest(['cmd1', 'cmd2']);
      const payload = request.toPayload();
      
      payload.ids.push('cmd3');
      expect(request.commandIds).toEqual(['cmd1', 'cmd2']); // Original should be unchanged
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new AcknowledgeCommandRequest(['cmd1', 'cmd2']);
      
      expect(() => {
        (request as any).commandIds = ['modified'];
      }).toThrow();
      
      expect(() => {
        (request as any).timestamp = new Date();
      }).toThrow();
    });

    it('should not modify original array', () => {
      const originalIds = ['cmd1', 'cmd2'];
      const request = new AcknowledgeCommandRequest(originalIds);
      
      originalIds.push('cmd3');
      expect(request.commandIds).toEqual(['cmd1', 'cmd2']); // Should be unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle single command ID', () => {
      const request = new AcknowledgeCommandRequest(['single-cmd']);
      expect(request.commandIds).toEqual(['single-cmd']);
    });

    it('should handle many command IDs', () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => `cmd${i}`);
      const request = new AcknowledgeCommandRequest(manyIds);
      expect(request.commandIds).toEqual(manyIds);
    });

    it('should handle special characters in command IDs', () => {
      const specialIds = ['cmd-1', 'cmd_2', 'cmd.3', 'cmd@4'];
      const request = new AcknowledgeCommandRequest(specialIds);
      expect(request.commandIds).toEqual(specialIds);
    });
  });
});