import React, { useState, ChangeEvent, useMemo } from 'react';
import AddButton from './Buttons/AddButton';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Defines a table column.
 *
 * @template T Row data type.
 */
export interface Column<T> {
  /** Key in the row object to display if no custom renderer is provided. */
  key: keyof T;
  /** Header label text. */
  header: string;
  /**
   * Optional custom cell renderer. If provided, will be used instead
   * of the default `row[col.key]` rendering.
   *
   * @param row The data object for this row.
   * @returns A React node to render in this cell.
   */
  render?: (row: T) => React.ReactNode;
}

/**
 * Props for TableComponent.
 *
 * @template T Row data type.
 */
export interface TableComponentProps<T> {
  /** Column definitions. */
  columns: Column<T>[];
  /** Array of row data. */
  data: T[];
  /** Number of rows per page; defaults to 10. */
  pageSize?: number;
  /**
   * Optional custom “Add…” button node.
   * If omitted, a default <AddButton /> is rendered.
   */
  addButton?: React.ReactNode;
  /**
   * Label text for the default AddButton when `addButton` is not provided.
   * E.g. "Add Admin", "Add Supervisor".
   * @default "Add Admin"
   */
  addLabel?: string;

  /** Overrides the background CSS class for the `<th>` row. */
  headerBg?: string;

  /** Overrides the padding CSS class for the table component */
  tablePadding?: string;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * TableComponent
 *
 * Renders:
 * 1. A toolbar with:
 *    • Left: the provided `addButton` (even if `null`) or a default
 *      `AddButton` labeled by `addLabel`.
 *    • Right: a search input that filters rows.
 * 2. A paginated table:
 *    • Header row styled with primary background, white text,
 *      with all four corners rounded.
 *    • Each body `<tr>` except the first gets a thin white top border.
 *    • A bottom border on the entire table (above pagination).
 * 3. Pagination controls.
 *
 * @template T Row data type.
 * @param props.columns   Column definitions.
 * @param props.data      Array of row objects.
 * @param props.pageSize  Rows per page.
 * @param props.addButton Optional custom add-button node.
 * @param props.addLabel  Label for default AddButton if `addButton` is absent.
 * @returns A JSX element displaying the searchable, paginated table.
 */
export function TableComponent<T>({
  columns,
  data,
  pageSize = 10,
  addButton,
  addLabel = 'Add Admin',
  headerBg = 'bg-[var(--color-primary-light)]',
  tablePadding = 'p-30',
}: TableComponentProps<T>): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filter rows by search term across all non-rendered columns
  const filteredData = useMemo(
    () =>
      data.filter(row =>
        columns.some(col => {
          if (col.render) return false;
          const cell = row[col.key];
          return (
            cell != null &&
            String(cell).toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
      ),
    [data, columns, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  // Rows for current page
  const pagedData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [filteredData, currentPage, pageSize]
  );

  const goPrevious = () => setCurrentPage(p => Math.max(1, p - 1));
  const goNext     = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className={`flex flex-col  ${tablePadding}  pt-10 `}>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        {addButton !== undefined
          ? addButton
          : (
            <AddButton
              label={addLabel}
              onClick={() => { /* TODO: hook up add action */ }}
            />
          )}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
          className="px-3 py-2 bg-[var(--color-primary)] text-white rounded border border-transparent focus:outline-none focus:ring-0"
        />
      </div>

      {/* Table */}
      <table className="min-w-full rounded-t-lg overflow-hidden border-b border-white">
        <thead>
          <tr>
            {columns.map((col, i) => {
              const isFirst = i === 0;
              const isLast  = i === columns.length - 1;
              return (
                <th
                  key={String(col.key)}
                  className={`
                    px-6 py-3 text-left text-sm font-semibold
                    ${headerBg} text-white
                    ${isFirst ? 'rounded-tl-lg rounded-bl-lg' : ''}
                    ${isLast  ? 'rounded-tr-lg rounded-br-lg' : ''}
                  `}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {pagedData.map((row, idx) => (
            <tr key={idx} className={idx > 0 ? 'border-t border-white' : ''}>
              {columns.map(col => (
                <td
                  key={String(col.key)}
                  className="px-6 py-4 whitespace-nowrap text-sm text-white"
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {pagedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-sm text-white"
              >
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between py-2 border-t border-white">
        <button
          onClick={goPrevious}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-[var(--color-primary)] rounded text-white disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-white">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-[var(--color-primary)] rounded text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
