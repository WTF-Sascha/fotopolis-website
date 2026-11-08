-- FOTOPOLIS Step 7: internal Admin RBAC, NO seeded accounts or privileges.
CREATE TABLE fotopolis.admin_members (
  user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE RESTRICT,
  admin_role text NOT NULL CHECK (admin_role IN ('owner','manager','viewer')),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fotopolis.admin_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON fotopolis.admin_members FROM PUBLIC;
CREATE TABLE fotopolis.admin_activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES fotopolis.admin_members(user_id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('create_booking','update_booking','cancel_booking','create_block','remove_block','change_resource')),
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fotopolis.admin_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON fotopolis.admin_activity FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA fotopolis FROM PUBLIC;
