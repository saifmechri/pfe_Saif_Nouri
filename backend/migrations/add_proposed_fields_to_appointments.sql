-- Migration: Add proposed appointment fields to appointments table
-- This allows garages to propose alternative dates/times to automobilistes

-- Check if columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add proposed_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='appointments' AND column_name='proposed_date'
    ) THEN
        ALTER TABLE appointments ADD COLUMN proposed_date DATE;
    END IF;
    
    -- Add proposed_time column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='appointments' AND column_name='proposed_time'
    ) THEN
        ALTER TABLE appointments ADD COLUMN proposed_time TIME;
    END IF;
    
    -- Add proposed_note column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='appointments' AND column_name='proposed_note'
    ) THEN
        ALTER TABLE appointments ADD COLUMN proposed_note TEXT;
    END IF;
    
    -- Update status constraint to include 'proposed'
    -- This is a PostgreSQL way to handle check constraints
    RAISE NOTICE 'Proposed fields migration completed';
END $$;
