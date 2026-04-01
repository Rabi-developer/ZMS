/**
 * Utility functions for formatting numbers with commas
 */

/**
 * Format a number with thousand separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 */
export const formatNumberWithCommas = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(num)) return '';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Remove commas from a formatted number string
 * @param value - The formatted string
 * @returns Number without commas
 */
export const removeCommas = (value: string): string => {
  return value.replace(/,/g, '');
};

/**
 * Input handlers for comma-formatted number inputs
 */
export const numberInputHandlers = {
  /**
   * OnBlur handler - formats the number with commas
   */
  onBlur: (e: React.FocusEvent<HTMLInputElement>, decimals: number = 2) => {
    const val = parseFloat(e.target.value.replace(/,/g, ''));
    if (!isNaN(val)) {
      e.target.value = formatNumberWithCommas(val, decimals);
    }
  },
  
  /**
   * OnFocus handler - removes commas for editing
   */
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/,/g, '');
    e.target.value = val;
  },
};
