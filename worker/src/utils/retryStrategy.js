/**
 * Retry Strategy System for Directory Submissions
 *
 * Provides differentiated retry logic based on error category:
 * - Infrastructure: Immediate retry with browser restart (separate counter)
 * - Transient: Standard exponential backoff
 * - Rate Limited: Long backoff to respect server limits
 * - Configuration: No retry (needs user action)
 * - Permanent: No retry
 */

import { ErrorCategory } from './errorClassifier.js';

// Retry configurations per error category
const RETRY_CONFIGS = {
  [ErrorCategory.TRANSIENT]: {
    maxRetries: 3,
    backoffMinutes: [2, 10, 30], // Shorter initial backoff
    immediateRetry: false
  },
  [ErrorCategory.PERMANENT]: {
    maxRetries: 0,
    backoffMinutes: [],
    immediateRetry: false,
    finalStatus: 'failed'
  },
  [ErrorCategory.INFRASTRUCTURE]: {
    maxRetries: 2, // Uses separate counter (infrastructure_retries)
    backoffMinutes: [0, 1], // Immediate, then 1 minute
    immediateRetry: true,
    requiresBrowserRestart: true,
    useSeparateCounter: true
  },
  [ErrorCategory.RATE_LIMITED]: {
    maxRetries: 3,
    backoffMinutes: [30, 120, 480], // 30min, 2hr, 8hr
    immediateRetry: false
  },
  [ErrorCategory.CONFIGURATION]: {
    maxRetries: 0, // No auto-retry
    backoffMinutes: [],
    immediateRetry: false,
    finalStatus: 'needs_review'
  }
};

/**
 * Get retry strategy for a given error classification
 *
 * @param {string} category - Error category from classifyError
 * @param {number} currentRetryCount - Current retry_count from submission
 * @param {number} infrastructureRetries - Current infrastructure_retries count
 * @returns {Object} Retry strategy with shouldRetry, delay, status, etc.
 */
export function getRetryStrategy(category, currentRetryCount = 0, infrastructureRetries = 0) {
  const config = RETRY_CONFIGS[category] || RETRY_CONFIGS[ErrorCategory.TRANSIENT];

  // Infrastructure errors use separate counter
  if (category === ErrorCategory.INFRASTRUCTURE) {
    if (infrastructureRetries >= config.maxRetries) {
      return {
        shouldRetry: false,
        status: 'failed',
        reason: 'Max infrastructure retries exceeded'
      };
    }
    return {
      shouldRetry: true,
      immediateRetry: config.immediateRetry,
      delayMinutes: config.backoffMinutes[infrastructureRetries] || 0,
      requiresBrowserRestart: config.requiresBrowserRestart,
      incrementInfraRetries: true,
      incrementRetryCount: false
    };
  }

  // Check if max retries exceeded
  if (currentRetryCount >= config.maxRetries) {
    return {
      shouldRetry: false,
      status: config.finalStatus || 'failed',
      reason: config.maxRetries === 0
        ? 'Error type does not support retry'
        : 'Max retries exceeded'
    };
  }

  // Calculate delay
  const delayMinutes = config.backoffMinutes[currentRetryCount] ?? 60;

  return {
    shouldRetry: true,
    immediateRetry: config.immediateRetry,
    delayMinutes,
    requiresBrowserRestart: config.requiresBrowserRestart || false,
    incrementRetryCount: true,
    incrementInfraRetries: false
  };
}

/**
 * Calculate the next retry time
 *
 * @param {number} delayMinutes - Delay in minutes
 * @returns {Date} Next retry timestamp
 */
export function calculateNextRetry(delayMinutes) {
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

/**
 * Get user-friendly message for retry status
 *
 * @param {Object} strategy - Result from getRetryStrategy
 * @param {string} category - Error category
 * @returns {string} Human-readable message
 */
export function getRetryMessage(strategy, category) {
  if (!strategy.shouldRetry) {
    switch (category) {
      case ErrorCategory.PERMANENT:
        return 'This error requires manual intervention. Please submit directly on the directory website.';
      case ErrorCategory.CONFIGURATION:
        return 'This directory needs a custom adapter configuration to work reliably.';
      default:
        return 'Maximum retries reached. Please try again later.';
    }
  }

  if (strategy.immediateRetry) {
    return 'Retrying immediately after system recovery...';
  }

  if (strategy.delayMinutes >= 60) {
    const hours = Math.round(strategy.delayMinutes / 60);
    return `Will retry in ${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `Will retry in ${strategy.delayMinutes} minute${strategy.delayMinutes > 1 ? 's' : ''}`;
}
