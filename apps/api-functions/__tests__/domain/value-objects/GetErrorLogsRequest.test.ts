import { GetErrorLogsRequest } from '../../../src/domain/value-objects/GetErrorLogsRequest';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';

describe('GetErrorLogsRequest', () => {
  describe('fromQuery', () => {
    it('should create request with endpoint parameter', () => {
      const query = { endpoint: '/api/test' };
      const request = GetErrorLogsRequest.fromQuery(query);

      expect(request.endpoint).toBe('/api/test');
    });

    it('should create request with resolved parameter as true string', () => {
      const query = { resolved: 'true' };
      const request = GetErrorLogsRequest.fromQuery(query);

      expect(request.resolved).toBe(true);
    });

    it('should create request with resolved parameter as boolean true', () => {
      const query = { resolved: true };
      const request = GetErrorLogsRequest.fromQuery(query);

      expect(request.resolved).toBe(true);
    });

    it('should create request with startDate parameter', () => {
      const query = { startDate: '2024-01-01T10:00:00Z' };
      const request = GetErrorLogsRequest.fromQuery(query);

      expect(request.startDate).toBeInstanceOf(Date);
    });

    it('should create request with endDate parameter', () => {
      const query = { endDate: '2024-01-01T11:00:00Z' };
      const request = GetErrorLogsRequest.fromQuery(query);

      expect(request.endDate).toBeInstanceOf(Date);
    });

    it('should create request with all parameters', () => {
      const query = {
        source: ErrorSource.Database,
        severity: ErrorSeverity.High,
        endpoint: '/api/test',
        resolved: 'false',
        startDate: '2024-01-01T10:00:00Z',
        endDate: '2024-01-01T11:00:00Z',
        limit: '10',
        offset: '0'
      };
      const request = GetErrorLogsRequest.fromQuery(query);

      expect(request.source).toBe(ErrorSource.Database);
      expect(request.severity).toBe(ErrorSeverity.High);
      expect(request.endpoint).toBe('/api/test');
      expect(request.resolved).toBe(false);
      expect(request.startDate).toBeInstanceOf(Date);
      expect(request.endDate).toBeInstanceOf(Date);
      expect(request.limit).toBe(10);
      expect(request.offset).toBe(0);
    });
  });
});

