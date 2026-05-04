/**
 * Token Blacklist Utility
 * Maintains a blacklist of invalidated JWT tokens (logout, password reset, etc.)
 * In production, use Redis for distributed token blacklisting
 */

const blacklistedTokens = new Set();

/**
 * Add a token to the blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} expiresIn - Token expiration time in milliseconds
 */
const addToBlacklist = (token, expiresIn) => {
  blacklistedTokens.add(token);
  
  // Auto-remove token from blacklist after it expires
  if (expiresIn) {
    setTimeout(() => {
      blacklistedTokens.delete(token);
    }, expiresIn);
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is blacklisted
 */
const isBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

/**
 * Clear all blacklisted tokens (use carefully, mainly for testing)
 */
const clearBlacklist = () => {
  blacklistedTokens.clear();
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
  clearBlacklist
};
