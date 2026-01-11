/**
 * @fileoverview TablePagination - Reusable pagination component for tables
 * @summary Provides pagination controls with page navigation
 * @description Displays pagination controls with Previous/Next buttons and
 * current page information. Supports both internal and external pagination modes.
 */

import React from 'react';
import type { ITablePaginationProps } from './types';
import { PaginationButton } from './components/PaginationButton';

/**
 * TablePagination component
 * 
 * Renders pagination controls with:
 * - Previous/Next buttons
 * - Current page and total pages display
 * - Optional total items and page size information
 * 
 * @param props - Component props
 * @returns JSX element with pagination controls
 */
export const TablePagination: React.FC<ITablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  disabled = false,
}) => {
  const handlePrevious = (): void => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = (): void => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-t border-white w-full">
      <PaginationButton
        label="Previous"
        onClick={handlePrevious}
        disabled={disabled || currentPage === 1}
      />
      
      <div className="flex flex-col items-center text-sm text-white">
        <span className="font-medium">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <PaginationButton
        label="Next"
        onClick={handleNext}
        disabled={disabled || currentPage >= totalPages}
      />
    </div>
  );
};

