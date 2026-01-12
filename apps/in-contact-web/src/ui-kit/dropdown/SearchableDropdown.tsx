/**
 * @fileoverview SearchableDropdown component
 * @summary Reusable dropdown with live filtering and checkbox selection
 * @description A dropdown component that allows searching and multi-select or single-select
 * with checkboxes. Supports portal rendering for z-index management.
 */

import React, { useState, useRef, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { useDropdownState } from './hooks/useDropdownState';
import { useFilteredOptions } from './hooks/useFilteredOptions';
import { useMultiSelect } from './hooks/useMultiSelect';
import { usePortalPosition } from './hooks/usePortalPosition';
import { useClickOutsideMultiple } from './hooks/useClickOutsideMultiple';
import { TableCheckbox } from '@/ui-kit/tables';
import { ClearButton } from '@/ui-kit/buttons';
import type { ISearchableDropdownProps } from './types/searchableDropdownTypes';

/**
 * SearchableDropdown component
 *
 * A reusable, controlled dropdown with live filtering and checkbox selection.
 *
 * - **Click** or **focus** the text input to open the menu.
 * - **Type** to filter all available options by label.
 * - **Click** a checkbox to include or exclude that option from `selectedValues`.
 * - Clicking outside or blurring closes the menu.
 * - Supports portal rendering for z-index management.
 *
 * @template Value The type of each option's `value`.
 * @param props - Component props
 * @returns JSX element with searchable dropdown
 */
export function SearchableDropdown<Value>({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = `
    w-full px-4 py-2
    bg-[var(--color-primary)] border-0 rounded
    text-white font-normal text-base
    placeholder-gray-200 placeholder-opacity-75 placeholder:text-base
    focus:outline-none
  `,
  menuClassName = `
    absolute left-0 top-full mt-1 w-full
    bg-[var(--color-primary)] border-0 rounded shadow-lg z-50
    text-gray-200 font-normal text-base
  `,
  itemClassName = `
    flex items-center px-4 py-2
    text-gray-200 font-normal text-base
    hover:bg-[var(--color-primary-light)] cursor-pointer
  `,
  usePortal = false,
  portalMinWidthPx,
  closeOnSelect = false,
  showSelectAll = false,
  isLoading = false,
}: Readonly<ISearchableDropdownProps<Value>>): JSX.Element {
  const [term, setTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dropdown state management
  const { isOpen, open, close } = useDropdownState(false);

  // Portal position calculation
  const { position: portalPosition } = usePortalPosition({
    containerRef,
    isOpen,
    usePortal,
  });

  // Click outside detection (supports portal rendering)
  useClickOutsideMultiple({
    refs: [containerRef, menuRef],
    handler: close,
    enabled: isOpen,
  });

  // Filter options by search term
  const filtered = useFilteredOptions({
    options,
    searchTerm: term,
    isLoading,
  });

  // Multi-select operations
  const { toggle, clearAll, selectAll } = useMultiSelect({
    selectedValues,
    onSelectionChange,
    closeOnSelect,
    onClose: close,
  });

  // Clear all selections (includes clearing search term)
  const handleClearAll = () => {
    clearAll();
    setTerm('');
  };

  // Select all filtered options (only those currently filtered by search)
  const handleSelectAll = () => {
    const allFilteredValues = filtered.map((opt) => opt.value);
    selectAll(allFilteredValues);
  };

  const menuContent = (
    <div
      ref={menuRef}
      className={menuClassName}
      role="menu"
      tabIndex={0}
      style={
        usePortal && portalPosition
          ? {
              position: 'fixed',
              top: portalPosition.top,
              left: portalPosition.left,
              width: Math.max(portalPosition.width, portalMinWidthPx || 0),
              zIndex: 2147483647,
            }
          : undefined
      }
      onMouseDown={(e) => {
        // Prevent outside-click handler from firing when interacting with the menu
        e.stopPropagation();
      }}
    >
      {/* Scrollable options container */}
      <div className="max-h-52 overflow-y-auto custom-scrollbar">
        {isLoading && (
          <div className="px-4 py-2 text-xs text-white font-medium">
            Loading...
          </div>
        )}

        {!isLoading &&
          filtered.map(opt => (
            <button
              type="button"
              key={String(opt.value)}
              className={itemClassName}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => toggle(opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(opt.value);
                }
              }}
            >
              <div className="mr-5">
                <TableCheckbox
                  checked={selectedValues.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
              </div>
              <span>{opt.label}</span>
            </button>
          ))}

        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-2 text-xs text-white font-medium">
            No results found
          </div>
        )}
      </div>

      {/* Footer with Select All button - only show if showSelectAll prop is true and there are filtered results */}
      {showSelectAll && filtered.length > 0 && (
        <div className="sticky bottom-0 bg-(--color-primary) border-t border-(--color-primary-light) px-4 py-2 flex justify-end">
          <button
            type="button"
            onClick={handleSelectAll}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            className="text-sm text-(--color-secondary) hover:text-white transition-colors font-medium"
          >
            Select All
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative inline-block w-1/3 ${className}`} ref={containerRef}>
      {/* Search input with clear button */}
      <div className="relative">
        <input
          type="search"
          placeholder={placeholder}
          value={term}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setTerm(e.target.value);
            open();
          }}
          onClick={open}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={inputClassName}
        />
        
        {/* Clear button - only show if there are selected values */}
        {selectedValues.length > 0 && (
          <ClearButton onClick={handleClearAll} title="Clear all selections" />
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (usePortal ? createPortal(menuContent, document.body) : menuContent)}
    </div>
  );
}

