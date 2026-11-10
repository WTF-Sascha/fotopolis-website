-- FOTOPOLIS Studio 13.0: isolated DEV-only schema, no customer records or live data imported.
-- Execute on Neon project icy-wave-78750589, branch development (br-super-leaf-b9jj8n9p) ONLY.
-- All tables are additive and all access must pass the Netlify server authentication gate.
CREATE SCHEMA IF NOT EXISTS fotopolis_studio13;

CREATE TABLE IF NOT EXISTS fotopolis_studio13.inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_key uuid NOT NULL UNIQUE,
 source text NOT NULL CHECK (source IN ('website','product','manual')),
 full_name varchar(100) NOT NULL,
 email varchar(254) NOT NULL,
 phone varchar(45),
 product varchar(30) NOT NULL CHECK (product IN ('Fotobox','Fotospiegel','Fotowohnwagen','Noch offen')),
 event_date date,
 event_location varchar(160),
 template_id varchar(6) CHECK (template_id IS NULL OR template_id ~ '^FP-[0-9]{3}$'),
 notes varchar(1500),
 consent_confirmed boolean NOT NULL CHECK (consent_confirmed),
 status text NOT NULL DEFAULT 'neu' CHECK (status IN ('neu','in_pruefung','angebot','abgeschlossen','abgesagt')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid
);

CREATE INDEX IF NOT EXISTS s13_inquiries_recent ON fotopolis_studio13.inquiries(created_at DESC);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.inquiry_history (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 inquiry_id uuid NOT NULL REFERENCES fotopolis_studio13.inquiries(id) ON DELETE RESTRICT,
 actor_id uuid,
 action text NOT NULL CHECK (action IN ('eingegangen','status_geaendert')),
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.analytics_daily (
 event_date date NOT NULL,
 page text NOT NULL CHECK (length(page)<=80),
 event_type text NOT NULL CHECK (event_type IN ('seitenaufruf','produktinteresse','designauswahl','anfrage_gesendet')),
 hits bigint NOT NULL DEFAULT 0 CHECK (hits>=0),
 PRIMARY KEY (event_date,page,event_type)
);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.cms_content (
 content_key text PRIMARY KEY CHECK(content_key IN ('hero_note','contact_note','faq_intro','about_note')),
 draft_text text NOT NULL DEFAULT '' CHECK (length(draft_text)<=1200),
 published_text text NOT NULL DEFAULT '' CHECK(length(published_text)<=1200),
 version integer NOT NULL DEFAULT 0 CHECK(version>=0),
 published_version integer NOT NULL DEFAULT 0 CHECK(published_version>=0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid
);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.cms_history (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 content_key text NOT NULL REFERENCES fotopolis_studio13.cms_content(content_key),
 version integer NOT NULL,
 published_text text NOT NULL,
 actor_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.media_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 filename varchar(100) NOT NULL,
 mime_type text NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp')),
 image_data bytea NOT NULL,
 file_bytes integer NOT NULL CHECK(file_bytes BETWEEN 16 AND 2097152),
 sha256 char(64) NOT NULL,
 alt_text varchar(200) NOT NULL,
 license_note varchar(350) NOT NULL,
 state text NOT NULL DEFAULT 'privat' CHECK(state IN ('privat','archiviert')),
 uploaded_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (octet_length(image_data)=file_bytes)
);

CREATE INDEX IF NOT EXISTS s13_media_recent ON fotopolis_studio13.media_assets(created_at DESC);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.design_reviews (
 template_id varchar(6) PRIMARY KEY CHECK(template_id ~ '^FP-0(?:[0-3][0-9]|4[0-4])$' AND template_id <> 'FP-000'),
 stage text NOT NULL DEFAULT 'unbearbeitet' CHECK(stage IN ('unbearbeitet','in_pruefung','freigegeben')),
 review_note varchar(600) NOT NULL DEFAULT '',
 updated_by uuid,
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.staff_roles (
 user_id uuid PRIMARY KEY,
 role text NOT NULL CHECK (role IN ('designer','editor','eventmanager','analyst')),
 active boolean NOT NULL DEFAULT true,
 assigned_by uuid,
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fotopolis_studio13.audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL,
 action text NOT NULL CHECK(length(action)<=80),
 target_type text NOT NULL CHECK(length(target_type)<=50),
 target_id text CHECK(length(target_id)<=80),
 created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO fotopolis_studio13.cms_content(content_key) VALUES ('hero_note'),('contact_note'),('faq_intro'),('about_note') ON CONFLICT(content_key) DO NOTHING;

REVOKE ALL ON SCHEMA fotopolis_studio13 FROM PUBLIC;

REVOKE ALL ON ALL TABLES IN SCHEMA fotopolis_studio13 FROM PUBLIC;
