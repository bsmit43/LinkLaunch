-- Migration: Add error categories and infrastructure retry tracking
-- This enables smart retry logic based on error type

-- Add error_category column to track what type of error occurred
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS error_category TEXT
CHECK (error_category IN ('transient', 'permanent', 'infrastructure', 'rate_limited', 'configuration'));

-- Add infrastructure_retries counter (separate from retry_count)
-- Infrastructure errors (browser crashes) get immediate retries without counting against the main retry limit
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS infrastructure_retries INTEGER DEFAULT 0;

-- Add index for querying failed submissions by error category
CREATE INDEX IF NOT EXISTS idx_submissions_error_category
ON submissions(error_category)
WHERE status = 'failed';

-- Add index for finding submissions that need configuration
CREATE INDEX IF NOT EXISTS idx_submissions_needs_review
ON submissions(status)
WHERE status = 'needs_review';

-- Comment on columns for documentation
COMMENT ON COLUMN submissions.error_category IS 'Category of the last error: transient, permanent, infrastructure, rate_limited, configuration';
COMMENT ON COLUMN submissions.infrastructure_retries IS 'Number of infrastructure (browser crash) retries, separate from main retry_count';
