import { formatCellValue, cellValueToString, getCellValue, renderCellContent } from '@/ui-kit/tables/utils/cellUtils';

describe('cellUtils', () => {
  describe('formatCellValue', () => {
    it('should return empty string for null', () => {
      expect(formatCellValue(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatCellValue(undefined)).toBe('');
    });

    it('should return string as-is', () => {
      expect(formatCellValue('test')).toBe('test');
    });

    it('should convert number to string', () => {
      expect(formatCellValue(123)).toBe('123');
    });

    it('should convert boolean to string', () => {
      expect(formatCellValue(true)).toBe('true');
      expect(formatCellValue(false)).toBe('false');
    });

    it('should stringify object', () => {
      expect(formatCellValue({ a: 1 })).toBe('{"a":1}');
    });

    it('should return [object] for circular objects', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      const result = formatCellValue(circular);
      expect(result).toBeTruthy();
    });

    it('should convert symbol to string', () => {
      const sym = Symbol('test');
      expect(formatCellValue(sym)).toBe(sym.toString());
    });

    it('should convert function to string', () => {
      const fn = () => {};
      expect(formatCellValue(fn)).toBe(fn.toString());
    });
  });

  describe('cellValueToString', () => {
    it('should return empty string for null', () => {
      expect(cellValueToString(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(cellValueToString(undefined)).toBe('');
    });

    it('should return string as-is', () => {
      expect(cellValueToString('test')).toBe('test');
    });

    it('should convert number to string', () => {
      expect(cellValueToString(123)).toBe('123');
    });

    it('should stringify object', () => {
      expect(cellValueToString({ a: 1 })).toBe('{"a":1}');
    });
  });

  describe('getCellValue', () => {
    const row = { id: '1', name: 'John', age: 30 };

    it('should return null when column key is not provided', () => {
      const col = { header: 'Name' };
      expect(getCellValue(row, col)).toBeNull();
    });

    it('should return value for string key', () => {
      const col = { key: 'name', header: 'Name' };
      expect(getCellValue(row, col)).toBe('John');
    });

    it('should return value for keyof key', () => {
      const col = { key: 'age' as keyof typeof row, header: 'Age' };
      expect(getCellValue(row, col)).toBe(30);
    });

    it('should return null when key does not exist', () => {
      const col = { key: 'nonexistent', header: 'Nonexistent' };
      expect(getCellValue(row, col)).toBeNull();
    });
  });

  describe('renderCellContent', () => {
    const row = { id: '1', name: 'John' };

    it('should use custom render function when provided', () => {
      const col = {
        key: 'name',
        header: 'Name',
        render: (row: typeof row) => row.name.toUpperCase(),
      };
      const result = renderCellContent(row, col);
      expect(result).toBe('JOHN');
    });

    it('should return empty string when no key and no render', () => {
      const col = { header: 'Name' };
      expect(renderCellContent(row, col)).toBe('');
    });

    it('should format value when no render function', () => {
      const col = { key: 'name', header: 'Name' };
      const result = renderCellContent(row, col);
      expect(result).toBe('John');
    });

    it('should format null value as empty string', () => {
      const col = { key: 'nonexistent', header: 'Nonexistent' };
      const result = renderCellContent(row, col);
      expect(result).toBe('');
    });
  });
});

