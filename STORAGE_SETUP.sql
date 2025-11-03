-- Create Storage Bucket for Ticket QR Codes
-- Run this on Supabase SQL Editor

-- 1. Create bucket (nếu chưa có)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-qr-codes', 'ticket-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set RLS policies cho bucket
-- Allow public to read QR codes
CREATE POLICY "Public can read ticket QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-qr-codes');

-- Allow authenticated users to upload QR codes (for system use)
CREATE POLICY "Service role can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ticket-qr-codes');

-- Allow system to delete expired QR codes
CREATE POLICY "Service role can delete QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'ticket-qr-codes');
