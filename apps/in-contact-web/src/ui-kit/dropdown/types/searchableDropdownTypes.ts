/**
 * @fileoverview SearchableDropdown type definitions
 * @summary Type definitions for SearchableDropdown component
 * @description Defines interfaces for searchable dropdown component
 */

/**
 * Represents a single option in the dropdown.
 */
export interface IDropdownOption<Value> {
  /**
   * The text label displayed for this option.
   */
  label: string;
  
  /**
   * The underlying value associated with this option.
   */
  value: Value;
}

/**
 * Props for the SearchableDropdown component.
 *
 * @template Value The type of each option's `value`.
 */
export interface ISearchableDropdownProps<Value> {
  /**
   * The complete list of options to display in the menu.
   */
  options: IDropdownOption<Value>[];

  /**
   * The currently selected values (controlled).
   * Only these values will remain "fixed" and shown elsewhere in your UI.
   */
  selectedValues: Value[];

  /**
   * Callback invoked when the user checks or unchecks an option.
   * 
   * @param values - New array of selected values
   */
  onSelectionChange: (values: Value[]) => void;

  /**
   * Placeholder text shown in the search input.
   * 
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Classes applied to the wrapper `<div>`.
   * 
   * @default ""
   */
  className?: string;

  /**
   * Classes applied to the `<input>` field.
   */
  inputClassName?: string;

  /**
   * Classes applied to the dropdown `<div>` menu.
   */
  menuClassName?: string;

  /**
   * Classes applied to each option row.
   */
  itemClassName?: string;

  /**
   * Render the dropdown menu in a portal attached to document.body.
   * 
   * @default false
   */
  usePortal?: boolean;

  /**
   * When rendering in portal, ensure the menu is at least this width (px).
   */
  portalMinWidthPx?: number;

  /**
   * Close the menu upon selecting an item.
   * Defaults to false to allow multiple selections.
   * 
   * @default false
   */
  closeOnSelect?: boolean;

  /**
   * Show "Select All" button in the dropdown footer.
   * 
   * @default false
   */
  showSelectAll?: boolean;

  /**
   * Shows a loading state instead of options.
   * 
   * @default false
   */
  isLoading?: boolean;
}

