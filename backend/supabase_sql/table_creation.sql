-- Paste into Supabase SQL editor. Creates helper to create per-organisation tables.
-- It assumes Postgres and Supabase default auth schema.

-- 1) Extension for uuid (if not enabled). Supabase usually has this.
-- FUNCTION: enable_uuid_extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgcrypto provides gen_random_uuid(), which is available in many managed setups.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- FUNCTION: normalize_org_name(text)
-- Helper to safely build identifiers from organisation names
CREATE OR REPLACE FUNCTION normalize_org_name(name TEXT)
RETURNS TEXT SECURITY DEFINER LANGUAGE SQL IMMUTABLE AS $$
  SELECT regexp_replace(lower(trim(name)), '[^a-z0-9_]+', '_', 'g');
$$;

-- 2) SQL-level schema arrays (single place to edit within SQL)
-- COMPENSATIONS
CREATE OR REPLACE FUNCTION schema_compensations_cols()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY['Upplagd av', 'Avser Mån/år', 'Ledare', 'employee_id', 'Kostnadsställe', 'Aktivitetstyp', 'Antal', 'Ersättning', 'Eventuell kommentar', 'Datum utbet']::TEXT[];
$$;
CREATE OR REPLACE FUNCTION schema_compensations_types()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY['TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT']::TEXT[];
$$;
CREATE OR REPLACE FUNCTION schema_compensations_defaults()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY[NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL]::TEXT[];
$$;
-- MONTHLY RETAINER
CREATE OR REPLACE FUNCTION schema_monthly_retainer_cols()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY['Ledare', 'KS', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec', 'Summa', 'Semers', 'TOTALT', 'Soc avg', 'TOT KLUBB']::TEXT[];
$$;
CREATE OR REPLACE FUNCTION schema_monthly_retainer_types()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY['TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT']::TEXT[];
$$;
CREATE OR REPLACE FUNCTION schema_monthly_retainer_defaults()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY[NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL]::TEXT[];
$$;
-- PERSONNEL
CREATE OR REPLACE FUNCTION schema_personnel_cols()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY['Upplagd av', 'Personnummer', 'Förnamn', 'Efternamn', 'Clearingnr', 'Bankkonto', 'Adress', 'Postnr', 'Postort', 'E-post', 'Kostnadsställe', 'Befattning', 'Ändringsdag', 'Månad', 'Timme', 'Heldag', 'Annan', 'Kommentar', 'added_to_fortnox', 'fortnox_id', 'fortnox_employee_id', 'Aktiv', 'Skattesats', 'Sociala Avgifter']::TEXT[];
$$;
CREATE OR REPLACE FUNCTION schema_personnel_types()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY['TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'BOOLEAN', 'TEXT', 'TEXT', 'BOOLEAN', 'NUMERIC', 'BOOLEAN']::TEXT[];
$$;
CREATE OR REPLACE FUNCTION schema_personnel_defaults()
RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT ARRAY[NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'false', NULL, NULL, 'true', '0', 'false']::TEXT[];
$$;


-- 3) Create tables for an organisation given desired columns for each type.
--    You pass arrays of column names and Postgres types that mirror your Excel headers.
--    For example: SELECT create_org_tables('acme'); -- uses default schemas below
-- FUNCTION: create_org_tables(text, text[], text[], text[], text[], text[], text[], text[], text[])
CREATE OR REPLACE FUNCTION create_org_tables(
  org_name TEXT,
  comp_cols TEXT[] DEFAULT schema_compensations_cols(),
  comp_types TEXT[] DEFAULT schema_compensations_types(),
  comp_defaults TEXT[] DEFAULT schema_compensations_defaults(),
  ret_cols  TEXT[] DEFAULT schema_monthly_retainer_cols(),
  ret_types TEXT[] DEFAULT schema_monthly_retainer_types(),
  ret_defaults TEXT[] DEFAULT schema_monthly_retainer_defaults(),
  pers_cols TEXT[] DEFAULT schema_personnel_cols(),
  pers_types TEXT[] DEFAULT schema_personnel_types(),
  pers_defaults TEXT[] DEFAULT schema_personnel_defaults()
) RETURNS VOID
SECURITY DEFINER
LANGUAGE PLPGSQL AS $$
DECLARE
  org TEXT;
  t_comp TEXT;
  t_ret TEXT;
  t_pers TEXT;
BEGIN
  PERFORM set_config('search_path', 'public', true);
  org := normalize_org_name(org_name);
  t_comp := org || '_compensations';
  t_ret := org || '_monthly_retainer';
  t_pers := org || '_personnel';

  -- Creates a table with id (uuid) pk, created_at default now(), and dynamic excel columns
  PERFORM create_if_not_exists_table_with_columns(t_comp, comp_cols, comp_types, comp_defaults);
  PERFORM create_if_not_exists_table_with_columns(t_ret,  ret_cols,  ret_types,  ret_defaults);
  PERFORM create_if_not_exists_table_with_columns(t_pers, pers_cols, pers_types, pers_defaults);
END;
$$;

-- 4) Helper that creates a table if not exists with id and created_at and the provided columns.
-- FUNCTION: create_if_not_exists_table_with_columns(text, text[], text[], text[])
CREATE OR REPLACE FUNCTION create_if_not_exists_table_with_columns(
  tbl_name TEXT,
  col_names TEXT[], col_types TEXT[], col_defaults TEXT[] DEFAULT NULL
) RETURNS VOID
SECURITY DEFINER
LANGUAGE PLPGSQL AS $$
DECLARE
  i INT;
  col_default TEXT;
  col_def_clause TEXT;
  col_default_expr TEXT;
BEGIN
  IF array_length(col_names,1) IS DISTINCT FROM array_length(col_types,1) THEN
    RAISE EXCEPTION 'Column names/types arrays must be same length';
  END IF;

  IF col_defaults IS NOT NULL AND array_length(col_names,1) IS DISTINCT FROM array_length(col_defaults,1) THEN
    RAISE EXCEPTION 'Column names/defaults arrays must be same length';
  END IF;

  EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS %I (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )', tbl_name);

  -- Add missing columns if needed
  FOR i IN 1..COALESCE(array_length(col_names,1),0) LOOP
    col_default := NULL;
    IF col_defaults IS NOT NULL THEN
      col_default := col_defaults[i];
    END IF;

    col_default_expr := NULL;
    IF col_default IS NOT NULL THEN
      IF col_default ILIKE 'RAW:%' THEN
        col_default_expr := substring(col_default FROM 5);
      ELSE
        col_default_expr := col_default;
      END IF;
    END IF;

    col_def_clause := '';
    IF col_default_expr IS NOT NULL THEN
      col_def_clause := ' DEFAULT ' || col_default_expr;
    END IF;

    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s%s', tbl_name, col_names[i], col_types[i], col_def_clause);

    IF col_default_expr IS NOT NULL THEN
      EXECUTE FORMAT('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT %s', tbl_name, col_names[i], col_default_expr);
      EXECUTE FORMAT('UPDATE %I SET %I = %s WHERE %I IS NULL', tbl_name, col_names[i], col_default_expr, col_names[i]);
    END IF;
  END LOOP;

  -- Ensure Row Level Security is enabled (idempotent)
  EXECUTE FORMAT('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
END;
$$;

CREATE OR REPLACE FUNCTION create_org_compensations(
  org_name TEXT,
  cols TEXT[] DEFAULT schema_compensations_cols(),
  types TEXT[] DEFAULT schema_compensations_types(),
  defaults TEXT[] DEFAULT schema_compensations_defaults()
)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
DECLARE
  org TEXT;
BEGIN
  org := normalize_org_name(org_name);
  PERFORM create_if_not_exists_table_with_columns(org || '_compensations', cols, types, defaults);
END;
$$;

CREATE OR REPLACE FUNCTION create_org_monthly_retainer(
  org_name TEXT,
  cols TEXT[] DEFAULT schema_monthly_retainer_cols(),
  types TEXT[] DEFAULT schema_monthly_retainer_types(),
  defaults TEXT[] DEFAULT schema_monthly_retainer_defaults()
)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
DECLARE
  org TEXT;
BEGIN
  org := normalize_org_name(org_name);
  PERFORM create_if_not_exists_table_with_columns(org || '_monthly_retainer', cols, types, defaults);
END;
$$;

-- FUNCTION: create_org_personnel(text)
CREATE OR REPLACE FUNCTION create_org_personnel(
  org_name TEXT,
  cols TEXT[] DEFAULT schema_personnel_cols(),
  types TEXT[] DEFAULT schema_personnel_types(),
  defaults TEXT[] DEFAULT schema_personnel_defaults()
)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
DECLARE
  org TEXT;
  tbl TEXT;
  idx_name TEXT;
BEGIN
  org := normalize_org_name(org_name);
  tbl := org || '_personnel';

  PERFORM create_if_not_exists_table_with_columns(tbl, cols, types, defaults);

  -- Unique index on email (case-insensitive), if column exists
  idx_name := tbl || '_email_uniq';
  EXECUTE FORMAT('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I ((lower(%I))) WHERE %I IS NOT NULL',
                 idx_name, tbl, 'E-post', 'E-post');
END;
$$;

-- FUNCTION: create_org_all_defaults(text)
CREATE OR REPLACE FUNCTION create_org_all_defaults(org_name TEXT)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
BEGIN
  -- call the explicit-argument variants to avoid overload ambiguity
  PERFORM create_org_compensations(
    org_name,
    schema_compensations_cols(),
    schema_compensations_types(),
    schema_compensations_defaults()
  );

  PERFORM create_org_monthly_retainer(
    org_name,
    schema_monthly_retainer_cols(),
    schema_monthly_retainer_types(),
    schema_monthly_retainer_defaults()
  );

  PERFORM create_org_personnel(
    org_name,
    schema_personnel_cols(),
    schema_personnel_types(),
    schema_personnel_defaults()
  );
END;
$$;

-- Organization Settings Table
-- Stores all settings for each organization as JSON
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization TEXT UNIQUE NOT NULL,
  settings_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster organization lookups
CREATE INDEX IF NOT EXISTS idx_organization_settings_org ON organization_settings(organization);

-- Enable Row Level Security
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Organizations can only access their own settings
-- This assumes you have a way to identify the current organization context
-- You may need to adjust this based on your authentication/authorization setup
CREATE POLICY organization_settings_policy ON organization_settings
  FOR ALL
  USING (
    -- Allow access if the organization matches the current context
    -- This is a placeholder - you'll need to implement organization context
    -- For example, using a function that gets the current user's organization
    organization = current_setting('app.current_organization', true)
    OR
    -- Or allow if user has admin role (adjust based on your auth setup)
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Alternative simpler policy if you handle organization filtering in your application:
-- CREATE POLICY organization_settings_policy ON organization_settings FOR ALL USING (true);
-- Then ensure your API layer filters by organization

-- USAGE EXAMPLE
-- Suppose your three Excel types have headers you want to mirror:
-- For compensations: ["employee", "amount", "month"]
-- For monthly_retainer: ["client", "retainer", "from_month"]
-- For personnel: ["name", "role", "hours"]
-- You can call (adjust arrays accordingly):
-- SELECT create_org_tables(
--   'acme',
--   ARRAY['employee','amount','month'], ARRAY['text','numeric','text'], ARRAY[NULL, NULL, NULL],
--   ARRAY['client','retainer','from_month'], ARRAY['text','numeric','text'], ARRAY[NULL, NULL, NULL],
--   ARRAY['name','role','hours'], ARRAY['text','text','numeric'], ARRAY[NULL, NULL, NULL]
-- );
--
-- For the default schemas defined in this file you can simply run:
-- SELECT create_org_tables('acme');
