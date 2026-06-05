/*
  # DevOps ROI Dashboard Schema

  ## Overview
  Creates the core tables for tracking automation job definitions and their execution logs,
  enabling ROI calculations, success rate analysis, and month-over-month trend reporting.

  ## New Tables

  ### automation_jobs
  Master registry of all automated jobs across systems.
  - `id` (uuid, primary key)
  - `name` (text) - Human-readable job name
  - `source_system` (text) - Origin system: Control-M, Power Automate, Jenkins, etc.
  - `department` (text) - Owning business unit
  - `manual_time_saved_per_run_minutes` (integer) - Minutes saved vs. manual process per execution
  - `active_status` (boolean) - Whether the job is currently active
  - `created_at` (timestamptz)

  ### job_executions
  Log of every individual job run with outcome and duration.
  - `id` (uuid, primary key)
  - `job_id` (uuid, foreign key -> automation_jobs.id)
  - `executed_at` (timestamptz) - When the run occurred
  - `status` (text) - 'Success' or 'Failed'
  - `execution_duration_seconds` (integer) - Wall-clock runtime of the job

  ## Security
  - RLS enabled on both tables
  - Authenticated users can read all records (executive dashboard read pattern)
  - No public write access
*/

CREATE TABLE IF NOT EXISTS automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_system text NOT NULL,
  department text NOT NULL,
  manual_time_saved_per_run_minutes integer NOT NULL DEFAULT 0,
  active_status boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES automation_jobs(id) ON DELETE CASCADE,
  executed_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('Success', 'Failed')),
  execution_duration_seconds integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON job_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_executed_at ON job_executions(executed_at);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);

ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read automation jobs"
  ON automation_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read job executions"
  ON job_executions FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon read for dashboard (no auth required for executive read-only view)
CREATE POLICY "Anon users can read automation jobs"
  ON automation_jobs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can read job executions"
  ON job_executions FOR SELECT
  TO anon
  USING (true);
