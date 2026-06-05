/*
  # Add description column to automation_jobs

  1. Changes
    - `automation_jobs`: new nullable `description` text column (default empty string)
  2. Data
    - Updates all 10 existing seed jobs with realistic, professional descriptions
      that give stakeholders business context for each automation.
  3. Notes
    - Uses IF NOT EXISTS guard so re-running is safe
    - No destructive operations; existing rows keep all other values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automation_jobs' AND column_name = 'description'
  ) THEN
    ALTER TABLE automation_jobs ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;

UPDATE automation_jobs SET description = 'Automates the removal of Active Directory access and M365 license reclamation during employee offboarding.'
  WHERE name = 'Bulk AD Deprovisioning';

UPDATE automation_jobs SET description = 'Bidirectional synchronisation of Jira issue states and assignments with internal engineering sprint trackers.'
  WHERE name = 'Jira Ticket Sync';

UPDATE automation_jobs SET description = 'Provisions accounts, assigns role-based access controls, and triggers IT hardware requests for new hires.'
  WHERE name = 'Employee Onboarding Workflow';

UPDATE automation_jobs SET description = 'Aggregates access logs, policy exceptions, and control test results into a SOC 2-aligned executive summary.'
  WHERE name = 'Weekly Compliance Report';

UPDATE automation_jobs SET description = 'Extracts, validates, and routes vendor invoices from email into the ERP approval queue via OCR and business rules.'
  WHERE name = 'Invoice Auto-Processing';

UPDATE automation_jobs SET description = 'Polls Kubernetes node metrics and triggers PagerDuty alerts when CPU, memory, or disk thresholds are breached.'
  WHERE name = 'EKS Node Health Check';

UPDATE automation_jobs SET description = 'Executes CVE scans across containerised workloads and publishes findings to the security risk register.'
  WHERE name = 'Security Vulnerability Scan';

UPDATE automation_jobs SET description = 'Nightly pipeline syncing financial transaction records from production databases to the analytics warehouse.'
  WHERE name = 'Data Warehouse ETL Refresh';

UPDATE automation_jobs SET description = 'Classifies and routes incoming IT service requests to the appropriate resolver group using keyword-based triage rules.'
  WHERE name = 'ServiceNow Ticket Router';

UPDATE automation_jobs SET description = 'Audits TLS certificate expiry across all public and internal endpoints and raises renewal tickets 30 days in advance.'
  WHERE name = 'Certificate Renewal Monitor';
