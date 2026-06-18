/**
 * Normalize user-controlled text before persistence.
 * @param {unknown} value Raw input.
 * @param {number} maxLength Maximum allowed length.
 * @returns {string}
 */
export function sanitizeText(value, maxLength = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
