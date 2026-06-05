/*
  # Refactor to items-based ROI model

  ## Changes
  - Renames `manual_time_saved_per_run_minutes` → `manual_time_saved_per_item_minutes`
    to reflect that savings are calculated per item/ticket processed, not per run.
  - Adds `items_processed_count` integer column to `job_executions`
    to record how many records were processed in each individual run.

  ## Updated Tables

  ### automation_jobs
  - `manual_time_saved_per_item_minutes` (renamed from per_run)

  ### job_executions
  - `items_processed_count` (new, default 1 for backward compat)
*/

-- Rename the column on automation_jobs
ALTER TABLE automation_jobs
  RENAME COLUMN manual_time_saved_per_run_minutes TO manual_time_saved_per_item_minutes;

-- Add items_processed_count to job_executions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_executions' AND column_name = 'items_processed_count'
  ) THEN
    ALTER TABLE job_executions ADD COLUMN items_processed_count integer NOT NULL DEFAULT 1;
  END IF;
END $$;
