/**
 * Date utility functions for calendar operations
 * Provides consistent date handling with UTC timezone support
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 * @param date - The date to format
 * @returns ISO date string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parses an ISO date string to Date object with consistent UTC timezone
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Date object in UTC
 */
export const parseISO = (dateString: string): Date => {
  // Ensure consistent timezone parsing
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
};

/**
 * Adds specified number of days to a date string
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @param delta - Number of days to add (can be negative)
 * @returns New ISO date string
 */
export const addDays = (dateStr: string, delta: number): string => {
  const date = parseISO(dateStr);
  date.setUTCDate(date.getUTCDate() + delta);
  return formatDate(date);
};

/**
 * Calculates the difference in days between two date strings
 * @param dateA - First date string (YYYY-MM-DD)
 * @param dateB - Second date string (YYYY-MM-DD)
 * @returns Number of days between dates (dateA - dateB)
 */
export const daysDiff = (dateA: string, dateB: string): number => {
  return Math.round((parseISO(dateA).getTime() - parseISO(dateB).getTime()) / MS_PER_DAY);
};

/**
 * Generates an array of date strings for a specified range
 * @param totalDays - Total number of days to generate
 * @param daysBefore - Number of days before today to start from
 * @returns Array of ISO date strings
 */
export const generateDateRange = (totalDays: number, daysBefore: number): string[] => {
  const today = new Date();
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  
  return Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() - daysBefore + i);
    return formatDate(date);
  });
};

/**
 * Memoized day generation function that caches results
 * @param totalColumns - Total number of columns/days
 * @param daysBefore - Number of days before today
 * @returns Cached array of date strings
 */
export const createMemoizedDayGenerator = (totalColumns: number, daysBefore: number) => {
  let cachedDays: string[] | null = null;
  
  return (): string[] => {
    if (cachedDays) return cachedDays;
    cachedDays = generateDateRange(totalColumns, daysBefore);
    return cachedDays;
  };
};

/**
 * Formats a date string for display in the calendar header
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "Jan 15")
 */
export const formatDateForDisplay = (dateString: string): string => {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};