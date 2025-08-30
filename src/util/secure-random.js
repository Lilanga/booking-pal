/**
 * Secure Random Utilities
 * Uses only cryptographically secure random number generators
 */

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
function generateSecureId(length = 9) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment - use Web Crypto API
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => (byte % 36).toString(36)).join('');
  } else {
    // Node.js environment - use crypto module
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(length).toString('hex').slice(0, length);
  }
}

/**
 * Generate a secure random number between 0 and 1
 * @returns {number} Random number between 0 and 1
 */
function generateSecureRandom() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment - use Web Crypto API
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
  } else {
    // Node.js environment - use crypto module
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomInt(0, 0xFFFFFFFF) / (0xFFFFFFFF + 1);
  }
}

/**
 * Generate a secure random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function generateSecureRandomInt(min, max) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment - use Web Crypto API
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
  } else {
    // Node.js environment - use crypto module
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomInt(min, max + 1);
  }
}

// CommonJS exports only
module.exports = {
  generateSecureId,
  generateSecureRandom,
  generateSecureRandomInt
};