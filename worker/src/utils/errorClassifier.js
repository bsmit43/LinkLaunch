/**
 * Error Classification System for Directory Submissions
 *
 * Categorizes errors to enable differentiated retry strategies:
 * - INFRASTRUCTURE: Browser/connection issues - immediate retry with restart
 * - TRANSIENT: Temporary issues - standard retry with backoff
 * - RATE_LIMITED: Server throttling - long backoff
 * - CONFIGURATION: Missing adapter - fail fast, needs user action
 * - PERMANENT: Won't change without intervention - no retry
 */

export const ErrorCategory = {
  TRANSIENT: 'transient',
  PERMANENT: 'permanent',
  INFRASTRUCTURE: 'infrastructure',
  RATE_LIMITED: 'rate_limited',
  CONFIGURATION: 'configuration'
};

// Error pattern matchers with associated metadata
const ERROR_PATTERNS = [
  // Infrastructure errors - browser/connection issues
  { pattern: /Protocol error/i, category: ErrorCategory.INFRASTRUCTURE },
  { pattern: /Connection closed/i, category: ErrorCategory.INFRASTRUCTURE },
  { pattern: /Target closed/i, category: ErrorCategory.INFRASTRUCTURE },
  { pattern: /Browser disconnected/i, category: ErrorCategory.INFRASTRUCTURE },
  { pattern: /Session closed/i, category: ErrorCategory.INFRASTRUCTURE },
  { pattern: /Execution context was destroyed/i, category: ErrorCategory.INFRASTRUCTURE },
  { pattern: /Browser crashed/i, category: ErrorCategory.INFRASTRUCTURE },

  // Transient errors - may resolve on retry
  { pattern: /Navigation timeout/i, category: ErrorCategory.TRANSIENT, adjustTimeout: true },
  { pattern: /Timeout exceeded/i, category: ErrorCategory.TRANSIENT, adjustTimeout: true },
  { pattern: /net::ERR_/i, category: ErrorCategory.TRANSIENT },
  { pattern: /ECONNREFUSED/i, category: ErrorCategory.TRANSIENT },
  { pattern: /ETIMEDOUT/i, category: ErrorCategory.TRANSIENT },
  { pattern: /ENOTFOUND/i, category: ErrorCategory.TRANSIENT },
  { pattern: /Element.*not found/i, category: ErrorCategory.TRANSIENT },
  { pattern: /waiting for selector/i, category: ErrorCategory.TRANSIENT },
  { pattern: /failed to find/i, category: ErrorCategory.TRANSIENT },

  // Rate limiting
  { pattern: /429/i, category: ErrorCategory.RATE_LIMITED },
  { pattern: /Too Many Requests/i, category: ErrorCategory.RATE_LIMITED },
  { pattern: /rate limit/i, category: ErrorCategory.RATE_LIMITED },
  { pattern: /slow down/i, category: ErrorCategory.RATE_LIMITED },
  { pattern: /throttl/i, category: ErrorCategory.RATE_LIMITED },

  // Permanent errors - won't change without intervention
  { pattern: /403.*Forbidden/i, category: ErrorCategory.PERMANENT },
  { pattern: /CAPTCHA/i, category: ErrorCategory.PERMANENT },
  { pattern: /reCAPTCHA/i, category: ErrorCategory.PERMANENT },
  { pattern: /hCaptcha/i, category: ErrorCategory.PERMANENT },
  { pattern: /already submitted/i, category: ErrorCategory.PERMANENT, markAsSubmitted: true },
  { pattern: /already exists/i, category: ErrorCategory.PERMANENT, markAsSubmitted: true },
  { pattern: /duplicate/i, category: ErrorCategory.PERMANENT },
  { pattern: /account required/i, category: ErrorCategory.PERMANENT },
  { pattern: /login required/i, category: ErrorCategory.PERMANENT },
  { pattern: /must be logged in/i, category: ErrorCategory.PERMANENT },
  { pattern: /access denied/i, category: ErrorCategory.PERMANENT },

  // Configuration errors - needs adapter setup
  { pattern: /Could not auto-detect any form fields/i, category: ErrorCategory.CONFIGURATION },
  { pattern: /adapter.*not found/i, category: ErrorCategory.CONFIGURATION },
  { pattern: /no form fields configured/i, category: ErrorCategory.CONFIGURATION },

  // AI-related errors
  { pattern: /AI error:/i, category: ErrorCategory.TRANSIENT }, // AI API issues - retry
  { pattern: /AI could not identify/i, category: ErrorCategory.CONFIGURATION }, // AI also failed - needs manual setup
  { pattern: /AI returned invalid/i, category: ErrorCategory.TRANSIENT }, // Bad AI response - retry
  { pattern: /AI detection unavailable/i, category: ErrorCategory.CONFIGURATION } // No API key - needs setup
];

/**
 * Classify an error message into a category with metadata
 *
 * @param {string} errorMessage - The error message to classify
 * @param {Object} context - Additional context about the submission
 * @returns {Object} Classification result with category and metadata
 */
export function classifyError(errorMessage, context = {}) {
  const message = errorMessage || '';

  for (const entry of ERROR_PATTERNS) {
    if (entry.pattern.test(message)) {
      return {
        category: entry.category,
        adjustTimeout: entry.adjustTimeout || false,
        markAsSubmitted: entry.markAsSubmitted || false,
        isRetryable: entry.category !== ErrorCategory.PERMANENT &&
                    entry.category !== ErrorCategory.CONFIGURATION,
        requiresBrowserRestart: entry.category === ErrorCategory.INFRASTRUCTURE,
        originalError: message
      };
    }
  }

  // For configuration errors with generic adapter and no config
  if (message.includes('Could not auto-detect') && !context.hasAdapterConfig) {
    return {
      category: ErrorCategory.CONFIGURATION,
      adjustTimeout: false,
      markAsSubmitted: false,
      isRetryable: false,
      requiresBrowserRestart: false,
      originalError: message
    };
  }

  // Default to transient for unknown errors
  return {
    category: ErrorCategory.TRANSIENT,
    adjustTimeout: false,
    markAsSubmitted: false,
    isRetryable: true,
    requiresBrowserRestart: false,
    originalError: message
  };
}

/**
 * Get a human-readable description of the error category
 *
 * @param {string} category - Error category
 * @returns {string} Description
 */
export function getCategoryDescription(category) {
  const descriptions = {
    [ErrorCategory.TRANSIENT]: 'Temporary issue - will retry automatically',
    [ErrorCategory.PERMANENT]: 'Permanent issue - requires manual intervention',
    [ErrorCategory.INFRASTRUCTURE]: 'System issue - recovering automatically',
    [ErrorCategory.RATE_LIMITED]: 'Rate limited - will retry with longer delay',
    [ErrorCategory.CONFIGURATION]: 'Missing configuration - needs adapter setup'
  };
  return descriptions[category] || 'Unknown error type';
}

/**
 * Check if an error indicates the browser needs to be restarted
 *
 * @param {string} errorMessage - The error message
 * @returns {boolean}
 */
export function isBrowserCrash(errorMessage) {
  const classification = classifyError(errorMessage);
  return classification.requiresBrowserRestart;
}
