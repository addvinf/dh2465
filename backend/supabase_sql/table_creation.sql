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

-- 3) Create tables for an organisation given desired columns for each type.
--    You pass arrays of column names and Postgres types that mirror your Excel headers.
--    For example: select create_org_tables('acme', ARRAY['col_a','col_b'], ARRAY['text','numeric'], ...);
-- FUNCTION: create_org_tables(text, text[], text[], text[], text[], text[], text[])
CREATE OR REPLACE FUNCTION create_org_tables(
  org_name TEXT,
  comp_cols TEXT[], comp_types TEXT[],
  ret_cols  TEXT[], ret_types TEXT[],
  pers_cols TEXT[], pers_types TEXT[]
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
  PERFORM create_if_not_exists_table_with_columns(t_comp, comp_cols, comp_types);
  PERFORM create_if_not_exists_table_with_columns(t_ret,  ret_cols,  ret_types);
  PERFORM create_if_not_exists_table_with_columns(t_pers, pers_cols, pers_types);
END;
$$;

-- 4) Helper that creates a table if not exists with id and created_at and the provided columns.
-- FUNCTION: create_if_not_exists_table_with_columns(text, text[], text[])
CREATE OR REPLACE FUNCTION create_if_not_exists_table_with_columns(
  tbl_name TEXT,
  col_names TEXT[], col_types TEXT[]
) RETURNS VOID
SECURITY DEFINER
LANGUAGE PLPGSQL AS $$
DECLARE
  i INT;
BEGIN
  IF array_length(col_names,1) IS DISTINCT FROM array_length(col_types,1) THEN
    RAISE EXCEPTION 'Column names/types arrays must be same length';
  END IF;

  EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS %I (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )', tbl_name);

  -- Add missing columns if needed
  FOR i IN 1..COALESCE(array_length(col_names,1),0) LOOP
    EXECUTE FORMAT('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s', tbl_name, col_names[i], col_types[i]);
  END LOOP;
END;
$$;

-- FUNCTION: create_org_compensations(text)
CREATE OR REPLACE FUNCTION create_org_compensations(org_name TEXT, cols TEXT[] DEFAULT
  ARRAY['Upplagd av','Avser Mån/år','Ledare','Kostnadsställe','Aktivitetstyp','Antal','Ersättning','Eventuell kommentar','Datum utbet']
)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
DECLARE
  org TEXT;
BEGIN
  org := normalize_org_name(org_name);
  PERFORM create_if_not_exists_table_with_columns(org || '_compensations', cols, (SELECT array(SELECT 'TEXT' FROM unnest(cols))));
END;
$$;

CREATE OR REPLACE FUNCTION create_org_monthly_retainer(org_name TEXT, cols TEXT[] DEFAULT
  ARRAY['Ledare','KS','Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec','Summa','Semers','TOTALT','Soc avg','TOT KLUBB']
)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
DECLARE
  org TEXT;
BEGIN
  org := normalize_org_name(org_name);
  PERFORM create_if_not_exists_table_with_columns(org || '_monthly_retainer', cols, (SELECT array(SELECT 'TEXT' FROM unnest(cols))));
END;
$$;

-- FUNCTION: create_org_personnel(text)
CREATE OR REPLACE FUNCTION create_org_personnel(org_name TEXT, cols TEXT[] DEFAULT
  ARRAY['Upplagd av','Personnummer','Förnamn','Efternamn','Clearingnr','Bankkonto','Adress','Postnr','Postort','E-post','Kostnadsställe','Ändringsdag','Månad','Timme','Heldag','Annan','Kommentar']
)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
DECLARE
  org TEXT;
BEGIN
  org := normalize_org_name(org_name);
  PERFORM create_if_not_exists_table_with_columns(org || '_personnel', cols, (SELECT array(SELECT 'TEXT' FROM unnest(cols))));
END;
$$;

-- FUNCTION: create_org_all_defaults(text)
CREATE OR REPLACE FUNCTION create_org_all_defaults(org_name TEXT)
RETURNS VOID SECURITY DEFINER LANGUAGE PLPGSQL AS $$
BEGIN
  PERFORM create_org_compensations(org_name);
  PERFORM create_org_monthly_retainer(org_name);
  PERFORM create_org_personnel(org_name);
END;
$$;

-- USAGE EXAMPLE
-- Suppose your three Excel types have headers you want to mirror:
-- For compensations: ["employee", "amount", "month"]
-- For monthly_retainer: ["client", "retainer", "from_month"]
-- For personnel: ["name", "role", "hours"]
-- You can call (adjust types accordingly):
-- select public.create_org_tables(
--   'acme',
--   ARRAY['employee','amount','month'], ARRAY['text','numeric','text'],
--   ARRAY['client','retainer','from_month'], ARRAY['text','numeric','text'],
--   ARRAY['name','role','hours'], ARRAY['text','text','numeric']
-- );
