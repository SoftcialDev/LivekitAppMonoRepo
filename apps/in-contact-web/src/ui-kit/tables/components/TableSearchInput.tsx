/**
 * @fileoverview TableSearchInput - Search input component for tables
 * @summary Displays search input for local table filtering
 * @description Provides a search input field for filtering table data locally
 */

import React from 'react';
import type { ITableSearchInputProps } from '../types';

/**
 * Search input component for tables
 * 
 * Displays a search input field for filtering table data.
 * Used when local search is enabled in the table.
 * 
 * @param props - Component props
 * @returns JSX element containing the search input
 */
export const TableSearchInput: React.FC<ITableSearchInputProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = 'Search...',
  isModalMode,
}) => {
  return (
    <div className={`mb-4 shrink-0 flex justify-start w-full ${isModalMode ? 'px-6 pt-4' : 'px-6'}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-2 bg-(--color-primary) text-white rounded border-transparent focus:outline-none w-48"
      />
    </div>
  );
};

