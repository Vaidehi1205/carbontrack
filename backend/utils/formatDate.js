/**
 * Format a Date-compatible value as YYYY-MM-DD.
 * @param {Date|string|number} value Date input.
 * @returns {string}
 */
export function formatDate(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}
