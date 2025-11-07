/**
 * @fileoverview Error handling utilities
 * @module utils/errorHandler
 */

import logger from './logger';

/**
 * Safely executes an async function and handles errors
 * @param {Function} fn - Async function to execute
 * @param {string} context - Context for logging
 * @returns {Promise} Result or error
 */
export async function safeAsync(fn, context = 'Operation') {
  try {
    return await fn();
  } catch (error) {
    logger.error(`${context} failed:`, error);
    throw error;
  }
}

/**
 * Safely executes a sync function and handles errors
 * @param {Function} fn - Function to execute
 * @param {string} context - Context for logging
 * @returns {*} Result or undefined on error
 */
export function safe(fn, context = 'Operation') {
  try {
    return fn();
  } catch (error) {
    logger.error(`${context} failed:`, error);
    return undefined;
  }
}

export default {
  safeAsync,
  safe
};
