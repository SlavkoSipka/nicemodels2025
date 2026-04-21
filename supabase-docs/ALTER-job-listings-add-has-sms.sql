-- Optional: SMS contact preference for job/rent listings (same phone number, sms: link on public page)
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS has_sms BOOLEAN DEFAULT false;
