/**
 * Secure Random Utilities (ES6 Module)
 * Uses only cryptographically secure random number generators
 */

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export function generateSecureId(length = 9) {
  // Browser environment - use Web Crypto API (always available in modern browsers)
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => (byte % 36).toString(36)).join('');
}

/**
 * Generate a secure random number between 0 and 1
 * @returns {number} Random number between 0 and 1
 */
export function generateSecureRandom() {
  // Browser environment - use Web Crypto API (always available in modern browsers)
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
}

/**
 * Generate a secure random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function generateSecureRandomInt(min, max) {
  // Browser environment - use Web Crypto API (always available in modern browsers)
  const range = max - min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}