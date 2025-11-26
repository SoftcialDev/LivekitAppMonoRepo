/**
 * @fileoverview Tests for GetErrorLogsRequest
 * @description Tests for error log query request value object
 */

import { GetErrorLogsRequest } from '../../../../../shared/domain/value-objects/GetErrorLogsRequest';
import { ErrorSource } from '../../../../../shared/domain/enums/ErrorSource';
import { ErrorSeverity } from '../../../../../shared/domain/enums/ErrorSeverity';

describe('GetErrorLogsRequest', () => {
  describe('fromQuery', () => {
    it('should create request from empty query', () => {
      const request = GetErrorLogsRequest.fromQuery({});

      expect(request.source).toBeUndefined();
      expect(request.severity).toBeUndefined();
      expect(request.endpoint).toBeUndefined();
      expect(request.resolved).toBeUndefined();
    });

    it('should create request with all filters', () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      const request = GetErrorLogsRequest.fromQuery({
        source: ErrorSource.ChatService,
        severity: ErrorSeverity.High,
        endpoint: '/api/snapshots',
        resolved: 'true',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: '50',
        offset: '10'
      });

      expect(request.source).toBe(ErrorSource.ChatService);
      expect(request.severity).toBe(ErrorSeverity.High);
      expect(request.endpoint).toBe('/api/snapshots');
      expect(request.resolved).toBe(true);
      expect(request.startDate).toEqual(startDate);
      expect(request.endDate).toEqual(endDate);
      expect(request.limit).toBe(50);
      expect(request.offset).toBe(10);
    });

    it('should handle resolved as boolean true', () => {
      const request = GetErrorLogsRequest.fromQuery({
        resolved: true
      });

      expect(request.resolved).toBe(true);
    });

    it('should handle resolved as string "true"', () => {
      const request = GetErrorLogsRequest.fromQuery({
        resolved: 'true'
      });

      expect(request.resolved).toBe(true);
    });

    it('should handle resolved as false', () => {
      const request = GetErrorLogsRequest.fromQuery({
        resolved: false
      });

      expect(request.resolved).toBe(false);
    });

    it('should handle resolved as string "false"', () => {
      const request = GetErrorLogsRequest.fromQuery({
        resolved: 'false'
      });

      expect(request.resolved).toBe(false);
    });

    it('should parse limit and offset as integers', () => {
      const request = GetErrorLogsRequest.fromQuery({
        limit: '100',
        offset: '20'
      });

      expect(request.limit).toBe(100);
      expect(request.offset).toBe(20);
    });

    it('should handle date strings', () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-31T23:59:59Z');

      const request = GetErrorLogsRequest.fromQuery({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      expect(request.startDate).toEqual(startDate);
      expect(request.endDate).toEqual(endDate);
    });
  });

  describe('toQueryParams', () => {
    it('should convert to ErrorLogQueryParams', () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-31T23:59:59Z');

      const request = GetErrorLogsRequest.fromQuery({
        source: ErrorSource.ChatService,
        severity: ErrorSeverity.High,
        endpoint: '/api/snapshots',
        resolved: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: '50',
        offset: '10'
      });

      const params = request.toQueryParams();

      expect(params.source).toBe(ErrorSource.ChatService);
      expect(params.severity).toBe(ErrorSeverity.High);
      expect(params.endpoint).toBe('/api/snapshots');
      expect(params.resolved).toBe(true);
      expect(params.startDate).toEqual(startDate);
      expect(params.endDate).toEqual(endDate);
      expect(params.limit).toBe(50);
      expect(params.offset).toBe(10);
    });

    it('should handle undefined values', () => {
      const request = GetErrorLogsRequest.fromQuery({});
      const params = request.toQueryParams();

      expect(params.source).toBeUndefined();
      expect(params.severity).toBeUndefined();
      expect(params.endpoint).toBeUndefined();
      expect(params.resolved).toBeUndefined();
    });
  });
});

