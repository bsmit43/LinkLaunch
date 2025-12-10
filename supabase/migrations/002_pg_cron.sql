-- pg_cron setup for automated queue processing
-- NOTE: pg_cron and pg_net extensions must be enabled in Supabase dashboard first
-- Go to Database > Extensions and enable: pg_cron, pg_net

-- STEP 1: Enable extensions (run in SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- STEP 2: Store secrets in vault (run manually in SQL Editor)
-- Replace with your actual values:
--
-- SELECT vault.create_secret('https://your-worker.onrender.com', 'worker_url');
-- SELECT vault.create_secret('your_secure_cron_secret_here', 'cron_secret');

-- STEP 3: Schedule the queue processor
-- This calls your Render worker every 5 minutes to process pending submissions
--
-- SELECT cron.schedule(
--   'process-submission-queue',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'worker_url') || '/process-queue',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
--     ),
--     body := jsonb_build_object(
--       'source', 'pg_cron',
--       'triggered_at', NOW()
--     )
--   ) AS request_id;
--   $$
-- );

-- Useful commands:
-- View scheduled jobs: SELECT * FROM cron.job;
-- View run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- Unschedule a job: SELECT cron.unschedule('process-submission-queue');

-- Add helper functions for submission stats
CREATE OR REPLACE FUNCTION increment_submission_success(p_website_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE websites
  SET updated_at = NOW()
  WHERE id = p_website_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_submission_failed(p_website_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE websites
  SET updated_at = NOW()
  WHERE id = p_website_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get submission stats for a website
CREATE OR REPLACE FUNCTION get_submission_stats(p_website_id UUID)
RETURNS TABLE(
  total BIGINT,
  pending BIGINT,
  in_progress BIGINT,
  submitted BIGINT,
  approved BIGINT,
  failed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress,
    COUNT(*) FILTER (WHERE status = 'submitted')::BIGINT as submitted,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed
  FROM submissions
  WHERE website_id = p_website_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
