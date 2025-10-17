import React, { useState, ChangeEvent, useMemo, useRef, useEffect } from 'react';
import AddButton from './Buttons/AddButton';
import Loading from './Loading';


////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Column metadata for a generic table.
 *
 * @template T Type of each row data object.
 */
export interface Column<T> {
  /**
   * Header text to display at the top of the column.
   */
  header: string;

  /**
   * Key of the row object to display when no custom render is provided.
   * If you use a `render` function, this can be omitted.
   */
  key?: keyof T | string;

  /**
   * Optional custom cell renderer.
   *
   * @param row The full row data object.
   * @returns A React node to render inside this cell.
   */
  render?: (row: T) => React.ReactNode;
}

/**
 * Props for the TableComponent.
 *
 * @template T Type of each row data object.
 */
export interface TableComponentProps<T> {
  /** Column definitions. */
  columns: Column<T>[];
  /** Array of row data (defaults to empty array). */
  data?: T[];
  /** Number of rows per page (defaults to 10). */
  pageSize?: number;
  /**
   * Optional custom “Add…” button node.
   * If omitted, a default <AddButton /> labeled by `addLabel` is rendered.
   */
  addButton?: React.ReactNode;
  /**
   * Label text for the default AddButton when `addButton` is not provided.
   * E.g. "Add Admin", "Add Supervisor".
   *
   * @default "Add Admin"
   */
  addLabel?: string;
  /** Overrides the background CSS class for the `<th>` row. */
  headerBg?: string;
  /** Overrides the padding CSS class for the table container. */
  tablePadding?: string;
  /**
   * If true, shows a loading spinner row instead of data.
   */
  loading?: boolean;
  /**
   * Text to display under the spinner when loading.
   *
   * @default "Loading…"
   */
  loadingAction?: string;
  /** If true, render a leading checkbox column for row selection. */
  showRowCheckboxes?: boolean;
  /** Return a stable unique key for a row (used by selection). Defaults to azureAdObjectId or index. */
  getRowKey?: (row: T, index: number) => string;
  /** Currently selected row keys. */
  selectedKeys?: string[];
  /** Toggle a single row selection. */
  onToggleRow?: (rowKey: string, checked: boolean) => void;
  /** Toggle all visible rows selection. */
  onToggleAll?: (checked: boolean, visibleRowKeys: string[]) => void;
  /** Custom actions to render on the right side of the toolbar (next to search). */
  rightActions?: React.ReactNode;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * TableComponent
 *
 * Renders:
 *   1. A toolbar with:
 *      • Left: the provided `addButton` (even if `null`) or a default
 *        `AddButton` labeled by `addLabel`.
 *      • Right: a search input that filters rows.
 *   2. A paginated table:
 *      • Header row styled with `headerBg`, white text, and rounded corners.
 *      • Each body `<tr>` except the first gets a thin white top border.
 *      • A bottom border on the entire table (above pagination).
 *   3. Pagination controls.
 *   4. A loading state: when `loading` is true, shows a single row
 *      with a centered spinner instead of data rows.
 *
 * @template T Row data type.
 * @param props.columns    Column definitions.
 * @param props.data       Array of row objects.
 * @param props.pageSize   Rows per page.
 * @param props.addButton  Optional custom add-button node.
 * @param props.addLabel   Label for default AddButton if `addButton` is absent.
 * @param props.headerBg   CSS classes for the header background.
 * @param props.tablePadding CSS classes for table container padding.
 * @param props.loading    Whether the table is in loading state.
 * @param props.loadingAction Text to show under the spinner.
 * @returns A JSX element displaying the searchable, paginated table.
 */
export function TableComponent<T extends { azureAdObjectId?: string }>(
  {
    columns,
    data = [],
    pageSize = 10,
    addButton,
    addLabel = 'Add Admin',
    headerBg = 'bg-[var(--color-primary-light)]',
    tablePadding = 'p-30',
    loading = false,
    loadingAction = 'Loading…',
    showRowCheckboxes = false,
    getRowKey,
    selectedKeys = [],
    onToggleRow,
    onToggleAll,
    rightActions,
  }: TableComponentProps<T>
): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredData = useMemo(
    () =>
      data.filter(row =>
        columns.some(col => {
          if (col.render) return false;
          if (col.key && typeof col.key !== 'string') {
            const cell = row[col.key as keyof T];
            return (
              cell != null &&
              String(cell)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            );
          }
          if (
            col.key &&
            typeof col.key === 'string' &&
            col.key in row
          ) {
            const cell = (row as any)[col.key];
            return (
              cell != null &&
              String(cell)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            );
          }
          return false;
        })
      ),
    [data, columns, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const pagedData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [filteredData, currentPage, pageSize]
  );

  const visibleRowKeys = useMemo(() =>
    pagedData.map((row, idx) => {
      const fallback = (row as any).azureAdObjectId ?? `row-${(currentPage - 1) * pageSize + idx}`;
      return getRowKey ? getRowKey(row, (currentPage - 1) * pageSize + idx) : String(fallback);
    }),
    [pagedData, getRowKey, currentPage, pageSize]
  );

  // Header checkbox reflect only current page selection
  const allVisibleSelected = useMemo(() =>
    visibleRowKeys.length > 0 && visibleRowKeys.every(k => selectedKeys.includes(k)),
    [visibleRowKeys, selectedKeys]
  );
  const someVisibleSelected = useMemo(() =>
    visibleRowKeys.some(k => selectedKeys.includes(k)) && !allVisibleSelected,
    [visibleRowKeys, selectedKeys, allVisibleSelected]
  );
  const headerCbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCbRef.current) {
      headerCbRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected, visibleRowKeys.join(','), selectedKeys.join(',')]);

  const goPrevious = () => setCurrentPage(p => Math.max(1, p - 1));
  const goNext = () =>
    setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className={`flex flex-col ${tablePadding} pt-10`}>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        {addButton !== undefined ? (
          addButton
        ) : (
          <AddButton
            label={addLabel}
            onClick={() => {
              /* hook up action */
            }}
          />
        )}
        <div className="flex items-center gap-2">
          {rightActions}
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            className="px-3 py-2 bg-[var(--color-primary)] text-white rounded border-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full rounded-t-lg overflow-hidden border-b border-white">
        <thead>
          <tr>
            {showRowCheckboxes && (
              <th className={`px-6 py-3 text-left text-sm font-semibold ${headerBg} text-white rounded-tl-lg rounded-bl-lg`}>
                <input
                  type="checkbox"
                  ref={headerCbRef}
                  checked={allVisibleSelected}
                  onChange={(e) => onToggleAll && onToggleAll(e.target.checked, visibleRowKeys)}
                  className="appearance-none w-5 h-5 rounded border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)] checked:bg-[var(--color-secondary)] checked:border-[var(--color-secondary)] focus:ring-0 focus:outline-none cursor-pointer transition-colors"
                />
              </th>
            )}
            {columns.map((col, i) => {
              const isFirst = !showRowCheckboxes && i === 0;
              const isLast = i === columns.length - 1;
              return (
                <th
                  key={`${String(col.key ?? col.header)}-hdr-${i}`}
                  className={`
                    px-6 py-3 text-left text-sm font-semibold
                    ${headerBg} text-white
                    ${isFirst ? 'rounded-tl-lg rounded-bl-lg' : ''}
                    ${isLast ? 'rounded-tr-lg rounded-br-lg' : ''}
                  `}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={(showRowCheckboxes ? 1 : 0) + columns.length} className="relative px-6 py-16 text-center min-h-[200px]">
                <Loading action={loadingAction} bgClassName="bg-gransparent " />
              </td>
            </tr>
          ) : (
            pagedData.map((row, idx) => (
              <tr
                key={
                  row.azureAdObjectId
                    ? row.azureAdObjectId
                    : `row-${idx}`
                }
                className={idx > 0 ? 'border-t border-white' : ''}
              >
                {showRowCheckboxes && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedKeys.includes(visibleRowKeys[idx])}
                      onChange={(e) => onToggleRow && onToggleRow(visibleRowKeys[idx], e.target.checked)}
                      className="appearance-none w-5 h-5 rounded border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)] checked:bg-[var(--color-secondary)] checked:border-[var(--color-secondary)] focus:ring-0 focus:outline-none cursor-pointer transition-colors"
                    />
                  </td>
                )}
                {columns.map((col, colIdx) => (
                  <td
                    key={`${String(col.key ?? col.header)}-${idx}-${colIdx}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-white"
                  >
                    {col.render
                      ? col.render(row)
                      : col.key && typeof col.key !== 'string'
                      ? String(row[col.key as keyof T] ?? '')
                      : col.key &&
                        typeof col.key === 'string' &&
                        col.key in row
                      ? String((row as any)[col.key] ?? '')
                      : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
          {!loading && pagedData.length === 0 && (
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
