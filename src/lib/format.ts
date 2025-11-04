// Utility functions for formatting values consistently between server and client

/**
 * Format number without locale-specific formatting to avoid hydration mismatch
 * @param num Number to format
 * @returns Formatted string with comma separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'

  // Use Intl.NumberFormat with explicit locale to ensure consistency
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format price in VND
 * @param price Price in VND
 * @returns Formatted price string
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '0 ₫'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

/**
 * Format date consistently
 * @param dateString ISO date string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }

  return new Date(dateString).toLocaleDateString('vi-VN', defaultOptions)
}

/**
 * Format date with time
 * @param dateString ISO date string
 * @returns Formatted date time string
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
