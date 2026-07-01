-- Add columns to session_outputs
-- Run this in Supabase SQL Editor

ALTER TABLE session_outputs
ADD COLUMN IF NOT EXISTS stat_summary JSONB DEFAULT NULL;

ALTER TABLE session_outputs
ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT NULL;

ALTER TABLE session_outputs
ADD COLUMN IF NOT EXISTS suggested_kpis JSONB DEFAULT NULL;
