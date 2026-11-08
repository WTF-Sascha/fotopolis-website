-- FOTOPOLIS 3.5 / Auth-only database role, Neon development branch ONLY
-- Role fotopolis_admin_auth_reader was provisioned via Neon as read_only.
-- This migration gives that role SELECT permission exclusively on the three
-- non-PII membership fields. The rest of the private schema remains inaccessible.
-- Run only after the Neon role exists. Do NOT apply to 'production'.
BEGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA fotopolis FROM fotopolis_admin_auth_reader;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA fotopolis FROM fotopolis_admin_auth_reader;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA fotopolis FROM fotopolis_admin_auth_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA fotopolis
  REVOKE SELECT ON TABLES FROM fotopolis_admin_auth_reader;
GRANT SELECT (user_id,admin_role,enabled)
  ON fotopolis.admin_members TO fotopolis_admin_auth_reader;
CREATE POLICY fotopolis_auth_reader_select_members
  ON fotopolis.admin_members FOR SELECT TO fotopolis_admin_auth_reader
  USING (true);
COMMIT;
