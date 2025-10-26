-- Add affiliated_hospital column to kyc table
ALTER TABLE kyc ADD COLUMN IF NOT EXISTS affiliated_hospital text;