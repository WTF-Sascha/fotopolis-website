-- FOTOPOLIS Studio 3.8 – REVIEW ONLY, DO NOT AUTO-APPLY.
-- Target: Neon project icy-wave-78750589 / branch development only.
-- Requires a separate database-security approval before execution.
-- Database role already exists as scoped read-only:
--   fotopolis_admin_inventory_writer
-- The statements below convert it to a STRICTLY SCOPED writer for resources
-- and an insert-only activity trail. No auth administration, booking access,
-- deletion, price changes or customer information.
BEGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA fotopolis FROM fotopolis_admin_inventory_writer;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA fotopolis FROM fotopolis_admin_inventory_writer;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA fotopolis FROM fotopolis_admin_inventory_writer;

GRANT USAGE ON SCHEMA fotopolis TO fotopolis_admin_inventory_writer;
GRANT SELECT (id, resource_code, product_type, display_name, enabled),
      INSERT (resource_code, product_type, display_name, enabled),
      UPDATE (display_name)
  ON fotopolis.resources TO fotopolis_admin_inventory_writer;
GRANT INSERT (user_id, action, entity_id)
  ON fotopolis.admin_activity TO fotopolis_admin_inventory_writer;

CREATE POLICY inventory_writer_read_resource ON fotopolis.resources
  FOR SELECT TO fotopolis_admin_inventory_writer USING (true);
CREATE POLICY inventory_writer_create_resource ON fotopolis.resources
  FOR INSERT TO fotopolis_admin_inventory_writer WITH CHECK (enabled=false);
CREATE POLICY inventory_writer_rename_resource ON fotopolis.resources
  FOR UPDATE TO fotopolis_admin_inventory_writer
  USING (true) WITH CHECK (true);
CREATE POLICY inventory_writer_log_change ON fotopolis.admin_activity
  FOR INSERT TO fotopolis_admin_inventory_writer
  WITH CHECK (action='change_resource');

ALTER DEFAULT PRIVILEGES IN SCHEMA fotopolis
  REVOKE SELECT ON TABLES FROM fotopolis_admin_inventory_writer;
COMMIT;

-- Pre-activation permission checks, executed separately after approval:
-- SELECT
--   has_column_privilege('fotopolis_admin_inventory_writer','fotopolis.resources','resource_code','INSERT') as resource_create,
--   has_column_privilege('fotopolis_admin_inventory_writer','fotopolis.resources','display_name','UPDATE') as resource_rename,
--   has_column_privilege('fotopolis_admin_inventory_writer','fotopolis.resources','enabled','UPDATE') as cannot_activate,
--   has_table_privilege('fotopolis_admin_inventory_writer','fotopolis.allocations','INSERT') as cannot_book,
--   has_table_privilege('fotopolis_admin_inventory_writer','fotopolis.admin_members','SELECT') as cannot_manage_roles;
-- Expected: true, true, false, false, false.
