/**
 * @fileoverview TableCheckbox - Reusable checkbox component for table row selection
 * @summary Checkbox component used in table rows and header
 * @description Styled checkbox component with consistent styling for table selection.
 * Supports both regular checkboxes and header checkboxes with indeterminate state.
 */

import React, { useRef, useEffect } from 'react';
import type { ITableCheckboxProps } from '../types';

/**
 * TableCheckbox component
 * 
 * Renders a styled checkbox with consistent styling for table row selection.
 * Supports indeterminate state for header checkboxes (e.g., "select all" when
 * some but not all items are selected).
 * 
 * @param props - Component props
 * @returns JSX element with a styled checkbox
 */
export const TableCheckbox: React.FC<ITableCheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.checked);
  };

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className="
        appearance-none 
        w-5 h-5 
        rounded 
        border-2 
        border-[var(--color-primary)] 
        bg-[var(--color-primary-light)] 
        checked:bg-[var(--color-secondary)] 
        checked:border-[var(--color-secondary)] 
        focus:ring-0 
        focus:outline-none 
        cursor-pointer 
        transition-colors
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    />
  );
};

