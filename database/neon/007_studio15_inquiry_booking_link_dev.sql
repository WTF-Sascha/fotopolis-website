-- FOTOPOLIS Studio 15.0 – only on Neon DEVELOPMENT branch br-super-leaf-b9jj8n9p.
-- Additive, nullable source link; existing allocations and their exclusion constraint stay intact.
-- NEVER execute on default/production branch without separate approval.
ALTER TABLE fotopolis.allocations
  ADD COLUMN IF NOT EXISTS inquiry_id uuid
  REFERENCES fotopolis_studio13.inquiries(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS s15_allocations_inquiry_id
  ON fotopolis.allocations(inquiry_id)
  WHERE inquiry_id IS NOT NULL;
-- Verify: booking remains a separate staff-authorized operation; no inquiry status
-- automatically creates a binding reservation.
