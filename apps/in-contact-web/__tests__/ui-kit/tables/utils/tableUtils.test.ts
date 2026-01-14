import { filterTableData, mergeDataWithoutDuplicates, calculatePageIndices } from '@/ui-kit/tables/utils/tableUtils';

describe('tableUtils', () => {
  describe('filterTableData', () => {
    const data = [
      { id: '1', name: 'John', email: 'john@example.com' },
      { id: '2', name: 'Jane', email: 'jane@example.com' },
      { id: '3', name: 'Bob', email: 'bob@example.com' },
    ];

    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
    ];

    it('should return all data when search term is empty', () => {
      const result = filterTableData(data, columns, '');
      expect(result).toHaveLength(3);
    });

    it('should return all data when search term is only whitespace', () => {
      const result = filterTableData(data, columns, '   ');
      expect(result).toHaveLength(3);
    });

    it('should filter by name (case-insensitive)', () => {
      const result = filterTableData(data, columns, 'john');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('should filter by email (case-insensitive)', () => {
      const result = filterTableData(data, columns, 'jane@example.com');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane');
    });

    it('should return empty array when no matches', () => {
      const result = filterTableData(data, columns, 'xyz');
      expect(result).toHaveLength(0);
    });

    it('should filter by multiple columns', () => {
      const result = filterTableData(data, columns, 'example');
      expect(result).toHaveLength(3);
    });

    it('should skip columns without key', () => {
      const colsWithoutKey = [{ header: 'Name' }];
      const result = filterTableData(data, colsWithoutKey, 'john');
      expect(result).toHaveLength(0);
    });

    it('should skip null/undefined cell values', () => {
      const dataWithNull = [
        { id: '1', name: 'John', email: null },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
      ];
      const result = filterTableData(dataWithNull, columns, 'null');
      expect(result).toHaveLength(0);
    });
  });

  describe('mergeDataWithoutDuplicates', () => {
    it('should merge arrays without duplicates', () => {
      const existing = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];
      const newItems = [
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const result = mergeDataWithoutDuplicates(existing, newItems);
      
      expect(result).toHaveLength(3);
      expect(result.map(r => r.id)).toEqual(['1', '2', '3']);
    });

    it('should handle items without id', () => {
      const existing = [{ name: 'A' }];
      const newItems = [{ name: 'B' }];
      const result = mergeDataWithoutDuplicates(existing, newItems);
      
      expect(result).toHaveLength(2);
    });

    it('should return existing when newItems is empty', () => {
      const existing = [{ id: '1', name: 'A' }];
      const newItems: typeof existing = [];
      const result = mergeDataWithoutDuplicates(existing, newItems);
      
      expect(result).toHaveLength(1);
      expect(result).toEqual(existing);
    });

    it('should return newItems when existing is empty', () => {
      const existing: Array<{ id: string; name: string }> = [];
      const newItems = [{ id: '1', name: 'A' }];
      const result = mergeDataWithoutDuplicates(existing, newItems);
      
      expect(result).toHaveLength(1);
      expect(result).toEqual(newItems);
    });
  });

  describe('calculatePageIndices', () => {
    it('should calculate indices for first page', () => {
      const result = calculatePageIndices(1, 10);
      expect(result).toEqual({ startIndex: 0, endIndex: 10 });
    });

    it('should calculate indices for second page', () => {
      const result = calculatePageIndices(2, 10);
      expect(result).toEqual({ startIndex: 10, endIndex: 20 });
    });

    it('should calculate indices for third page', () => {
      const result = calculatePageIndices(3, 5);
      expect(result).toEqual({ startIndex: 10, endIndex: 15 });
    });

    it('should handle different page sizes', () => {
      const result = calculatePageIndices(2, 20);
      expect(result).toEqual({ startIndex: 20, endIndex: 40 });
    });
  });
});

