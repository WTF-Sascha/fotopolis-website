-- FOTOPOLIS 3.6 - Neon development branch only.
-- The role fotopolis_admin_dashboard_reader already exists and is scoped to neondb.
BEGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA fotopolis FROM fotopolis_admin_dashboard_reader;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA fotopolis FROM fotopolis_admin_dashboard_reader;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA fotopolis FROM fotopolis_admin_dashboard_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA fotopolis REVOKE SELECT ON TABLES FROM fotopolis_admin_dashboard_reader;
GRANT SELECT (id,resource_code,product_type,display_name,enabled)
 ON fotopolis.resources TO fotopolis_admin_dashboard_reader;
GRANT SELECT (id,resource_id,allocation_kind,allocation_state,event_start_at,event_end_at,occupied_from,occupied_until)
 ON fotopolis.allocations TO fotopolis_admin_dashboard_reader;
CREATE POLICY fotopolis_dashboard_reader_resources ON fotopolis.resources
 FOR SELECT TO fotopolis_admin_dashboard_reader USING (true);
CREATE POLICY fotopolis_dashboard_reader_allocations ON fotopolis.allocations
 FOR SELECT TO fotopolis_admin_dashboard_reader USING (true);
COMMIT;
