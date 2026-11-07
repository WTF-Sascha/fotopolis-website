-- FOTOPOLIS / Roadmap 6
-- REVIEW-ONLY SQL MODULE. NEVER apply to existing unrelated Supabase projects.
-- UTC instants are stored as timestamptz; customer-facing times use Europe/Berlin.
-- Not an applied Supabase migration: no dedicated FOTOPOLIS project yet.
BEGIN;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

CREATE SCHEMA IF NOT EXISTS fotopolis;

-- One row represents ONE individually rentable physical device, not a product
-- family. Do not pre-populate invented inventory or prices.
CREATE TABLE fotopolis.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_code text NOT NULL UNIQUE,
  product_type text NOT NULL CHECK (product_type IN ('fotobox','fotospiegel','fotowohnwagen')),
  display_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resource_code_limits CHECK (char_length(resource_code) BETWEEN 3 AND 60),
  CONSTRAINT display_name_limits CHECK (char_length(display_name) BETWEEN 2 AND 100)
);

-- The blocking interval includes delivery, setup, dismantling and travel buffers
-- whenever the operator needs them. Use half-open [start,end): adjacent slots
-- are allowed, overlapping slots are not. Never infer these buffers as promises.
CREATE TABLE fotopolis.allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES fotopolis.resources(id) ON DELETE RESTRICT,
  allocation_kind text NOT NULL CHECK (allocation_kind IN ('booking','internal_block','maintenance')),
  allocation_state text NOT NULL CHECK (allocation_state IN ('held','confirmed','blocked','cancelled')),
  event_start_at timestamptz NOT NULL,
  event_end_at timestamptz NOT NULL,
  occupied_from timestamptz NOT NULL,
  occupied_until timestamptz NOT NULL,
  occupied_window tstzrange GENERATED ALWAYS AS
    (tstzrange(occupied_from,occupied_until,'[)')) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT allocation_valid_times CHECK (
    occupied_from < occupied_until
    AND event_start_at < event_end_at
    AND occupied_from <= event_start_at
    AND event_end_at <= occupied_until
  ),
  CONSTRAINT allocation_valid_state CHECK (
    (allocation_kind = 'booking' AND allocation_state IN ('held','confirmed','cancelled'))
    OR (allocation_kind IN ('internal_block','maintenance') AND allocation_state IN ('blocked','cancelled'))
  ),
  CONSTRAINT resource_time_no_overlap EXCLUDE USING gist (
    resource_id WITH =,
    occupied_window WITH &&
  ) WHERE (allocation_state IN ('held','confirmed','blocked'))
);

-- Indexes for the eventual admin calendar. No customer-facing query is exposed.
CREATE INDEX allocations_resource_start_idx
  ON fotopolis.allocations(resource_id,occupied_from);
CREATE INDEX allocations_state_start_idx
  ON fotopolis.allocations(allocation_state,event_start_at);

-- Immutable history for inserts and updates, no customer PII, no visitor data.
-- Actor is the DB role; named staff attribution requires future admin auth.
CREATE TABLE fotopolis.allocation_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  allocation_id uuid NOT NULL REFERENCES fotopolis.allocations(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE')),
  before_state jsonb,
  after_state jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  actor_db_role text NOT NULL DEFAULT current_user
);

CREATE FUNCTION fotopolis.touch_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $touch$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$touch$;

CREATE TRIGGER touch_allocation_before_update
BEFORE UPDATE ON fotopolis.allocations
FOR EACH ROW EXECUTE FUNCTION fotopolis.touch_allocation();

CREATE FUNCTION fotopolis.capture_allocation_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $capture$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO fotopolis.allocation_audit (allocation_id,action,before_state,after_state)
    VALUES (NEW.id,'INSERT',NULL,to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO fotopolis.allocation_audit (allocation_id,action,before_state,after_state)
    VALUES (NEW.id,'UPDATE',to_jsonb(OLD),to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$capture$;

-- AFTER timing is essential: the allocation FK must exist before writing audit.
CREATE TRIGGER capture_allocation_audit
AFTER INSERT OR UPDATE ON fotopolis.allocations
FOR EACH ROW EXECUTE FUNCTION fotopolis.capture_allocation_change();

-- Internal-only read model. No anonymous/public availability endpoint or RPC.
CREATE FUNCTION fotopolis.available_resources(
  p_start timestamptz,
  p_end timestamptz,
  p_product_type text DEFAULT NULL
)
RETURNS TABLE(resource_id uuid, product_type text, display_name text)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $availability$
BEGIN
  IF p_start IS NULL OR p_end IS NULL OR p_start >= p_end THEN
    RAISE EXCEPTION 'Invalid occupancy window' USING ERRCODE = '22007';
  END IF;
  IF p_product_type IS NOT NULL AND
     p_product_type NOT IN ('fotobox','fotospiegel','fotowohnwagen') THEN
    RAISE EXCEPTION 'Invalid product type' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT r.id,r.product_type,r.display_name
  FROM fotopolis.resources AS r
  WHERE r.enabled
    AND (p_product_type IS NULL OR r.product_type = p_product_type)
    AND NOT EXISTS (
      SELECT 1 FROM fotopolis.allocations AS a
      WHERE a.resource_id = r.id
        AND a.allocation_state IN ('held','confirmed','blocked')
        AND a.occupied_window && tstzrange(p_start,p_end,'[)')
    )
  ORDER BY r.product_type,r.resource_code;
END;
$availability$;

-- Fail closed. The schema is not part of the public Data API. RLS is an extra
-- guard; never authorize anon/authenticated until the admin RBAC design is ready.
ALTER TABLE fotopolis.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotopolis.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotopolis.allocation_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA fotopolis FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA fotopolis FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA fotopolis FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA fotopolis FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA fotopolis
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
COMMIT;
