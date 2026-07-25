-- Add reason column to signals_log for storing signal reasoning
ALTER TABLE signals_log ADD COLUMN IF NOT EXISTS reason TEXT;