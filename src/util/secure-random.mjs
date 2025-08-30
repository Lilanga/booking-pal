/**
 * Secure Random Utilities (ES6 Module)
 * Provides cryptographically secure alternatives to Math.random()
 * Browser-compatible version
 */

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export function generateSecureId(length = 9) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use Web Crypto API when available (browser/modern environments)
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => (byte % 36).toString(36)).join('');
  } else if (typeof require !== 'undefined') {
    // Fallback for Node.js environments
    try {
      const nodeCrypto = require('crypto');
      return nodeCrypto.randomBytes(length).toString('hex').slice(0, length);
    } catch (e) {
      // If crypto is not available, fall back to Math.random with warning
      console.warn('Crypto not available, falling back to Math.random()');
      return Math.random().toString(36).substr(2, length);
    }
  } else {
    // Final fallback with warning
    console.warn('No secure random generator available, using Math.random()');
    return Math.random().toString(36).substr(2, length);
  }
}

/**
 * Generate a secure random number between 0 and 1
 * @returns {number} Random number between 0 and 1
 */
export function generateSecureRandom() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
  } else if (typeof require !== 'undefined') {
    try {
      const nodeCrypto = require('crypto');
      return nodeCrypto.randomInt(0, 0xFFFFFFFF) / (0xFFFFFFFF + 1);
    } catch (e) {
      console.warn('Crypto not available, falling back to Math.random()');
      return Math.random();
    }
  } else {
    console.warn('No secure random generator available, using Math.random()');
    return Math.random();
  }
}

/**
 * Generate a secure random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function generateSecureRandomInt(min, max) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
  } else if (typeof require !== 'undefined') {
    try {
      const nodeCrypto = require('crypto');
      return nodeCrypto.randomInt(min, max + 1);
    } catch (e) {
      console.warn('Crypto not available, falling back to Math.random()');
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  } else {
    console.warn('No secure random generator available, using Math.random()');
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}