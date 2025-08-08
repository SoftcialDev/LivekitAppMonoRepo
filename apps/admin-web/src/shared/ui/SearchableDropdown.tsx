import React, { useState, useRef, useEffect, ChangeEvent } from 'react';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a single option in the dropdown.
 */
export interface DropdownOption<Value> {
  /** The text label displayed for this option. */
  label: string;
  /** The underlying value associated with this option. */
  value: Value;
}

/**
 * Props for the SearchableDropdown component.
 *
 * @template Value The type of each option’s `value`.
 */
export interface SearchableDropdownProps<Value> {
  /** The complete list of options to display in the menu. */
  options: DropdownOption<Value>[];
  /**
   * The currently selected values (controlled).
   * Only these values will remain “fixed” and shown elsewhere in your UI.
   */
  selectedValues: Value[];
  /** Callback invoked when the user checks or unchecks an option. */
  onSelectionChange: (values: Value[]) => void;
  /** Placeholder text shown in the search input. Default: `"Search..."` */
  placeholder?: string;
  /** Classes applied to the wrapper `<div>`. Default: `""`. */
  className?: string;
  /** Classes applied to the `<input>` field. Default: `w-full px-4 py-2 bg-white border rounded focus:outline-none`. */
  inputClassName?: string;
  /** Classes applied to the dropdown `<div>` menu. */
  menuClassName?: string;
  /** Classes applied to each option row. */
  itemClassName?: string;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * SearchableDropdown
 *
 * A reusable, controlled dropdown with live filtering and checkbox selection.
 *
 * - **Click** or **focus** the text input to open the menu.
 * - **Type** to filter all available options by label.
 * - **Click** a checkbox to include or exclude that option from `selectedValues`.
 * - Clicking outside or blurring closes the menu.
 * - The menu will match its parent’s width via `-webkit-fill-available` and
 *   sit on top of any underlying content (`z-index`).
 *
 * @template Value The type of each option’s `value`.
 * @param props.options            Complete list of options.
 * @param props.selectedValues     Array of values currently selected.
 * @param props.onSelectionChange  Handler called with new selection array.
 * @param props.placeholder        Text shown when input is empty.
 * @param props.className          Wrapper `<div>` CSS classes.
 * @param props.inputClassName     Text input CSS classes.
 * @param props.menuClassName      Dropdown menu CSS classes.
 * @param props.itemClassName      Each option row CSS classes.
 */
export function SearchableDropdown<Value>({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = `
    w-11/12 px-4 py-2
    bg-[var(--color-primary)] border-0 rounded
    text-white font-normal text-base
    placeholder-gray-200 placeholder-opacity-75 placeholder:text-base
    focus:outline-none
  `,
  menuClassName = `
    absolute left-0 top-full mt-1 w-11/12 max-h-60 overflow-auto
    bg-[var(--color-primary)] border-0 rounded shadow-lg z-50
    text-gray-200 font-normal text-base
  `,
  itemClassName = `
    flex items-center px-4 py-2
    text-gray-200 font-normal text-base
    hover:bg-[var(--color-primary-light)] cursor-pointer
  `,
}: SearchableDropdownProps<Value>): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter options by search term
  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(term.toLowerCase())
  );

  // Toggle inclusion of a value
  const toggle = (value: Value) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  return (
    <div className={`relative inline-block w-1/3  ${className}`} ref={containerRef}>
      {/* Search input */}
      <input
        type="text"
        placeholder={placeholder}
        value={term}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setTerm(e.target.value);
          setIsOpen(true);
        }}
        onClick={() => setIsOpen(true)}
        className={inputClassName}
      />

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={menuClassName}
        >
          {filtered.map(opt => (
            <div
              key={String(opt.value)}
              className={itemClassName}
              onMouseDown={e => e.preventDefault()} // Prevent blur
              onClick={() => toggle(opt.value)}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                readOnly
                className="mr-5 appearance-none w-5 h-5 rounded border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)] checked:bg-[var(--color-secondary)] checked:border-[var(--color-secondary)] focus:ring-0 focus:outline-none cursor-pointer transition-colors"
      
              />
              <span>{opt.label}</span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-2 text-xs text-white font-medium">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
