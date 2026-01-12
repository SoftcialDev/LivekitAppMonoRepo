/**
 * @fileoverview useTableSelection Hook Types
 * @summary Type definitions for useTableSelection hook
 * @description Type definitions for the useTableSelection hook parameters
 */

/**
 * Parameters for useTableSelection hook
 * 
 * @template T Type of each row data object
 */
export interface IUseTableSelectionParams<T> {
  /**
   * Currently selected row keys
   */
  selectedKeys: string[];

  /**
   * State setter for selected keys
   */
  setSelectedKeys: React.Dispatch<React.SetStateAction<string[]>>;

  /**
   * Function to get a unique key for a row
   * 
   * @param row - The row data object
   * @param index - The index of the row in the data array
   * @returns Unique string key for the row
   */
  getRowKey: (row: T, index: number) => string;
}

