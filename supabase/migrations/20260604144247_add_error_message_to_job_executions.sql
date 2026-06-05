/*
  # Add error_message to job_executions

  1. Changes
    - `job_executions`: adds nullable `error_message TEXT` column
  2. Seed
    - Backfills all existing Failed executions with realistic DevOps error strings
      drawn randomly from eight distinct failure scenarios
  3. Notes
    - Safe: uses IF NOT EXISTS guard so re-running is a no-op
    - RLS unchanged (column inherits existing table policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_executions' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE job_executions ADD COLUMN error_message TEXT;
  END IF;
END $$;

UPDATE job_executions
SET error_message = CASE (FLOOR(RANDOM() * 10))::INT
  WHEN 0 THEN 'Timeout: no response from ServiceNow API after 30s'
  WHEN 1 THEN 'Authentication token expired — OIDC refresh failed'
  WHEN 2 THEN 'Target DB locked: concurrent write detected on table job_queue'
  WHEN 3 THEN 'Connection refused: host erp.internal:5432 unreachable'
  WHEN 4 THEN 'Assertion failed: expected items > 0, got 0 (empty queue)'
  WHEN 5 THEN 'SSL certificate verification failed for api.vendor.io'
  WHEN 6 THEN 'Rate limit exceeded: 429 from downstream API, retries exhausted'
  WHEN 7 THEN 'Unhandled exception in step "validate_payload": NullPointerException at line 142'
  WHEN 8 THEN 'Upstream dependency unavailable: SAP RFC_PING returned RFCIO_ERROR_SYSFAIL'
  ELSE        'Step "push_to_queue" failed: message broker rejected payload (size > 256KB)'
END
WHERE status = 'Failed'
  AND error_message IS NULL;
