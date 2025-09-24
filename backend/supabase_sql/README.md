# Database API Guide (Supabase SQL + Express)

This guide documents the backend endpoints that create and modify database tables/rows for each organization. It lives alongside the SQL helpers in this folder.

## Prerequisites
- Install the SQL helpers into your Supabase project:
  - Open Supabase → SQL editor and paste the contents of `table_creation.sql`.
  - It creates/updates functions (with SECURITY DEFINER) and enables `pgcrypto` so `gen_random_uuid()` works.
  - Functions created:
    - `normalize_org_name(text)`
    - `create_if_not_exists_table_with_columns(text, text[], text[])`
    - `create_org_tables(text, text[], text[], text[], text[], text[], text[])`
    - `create_org_compensations(text, text[])`
    - `create_org_monthly_retainer(text, text[])`
    - `create_org_personnel(text, text[])`
    - `create_org_all_defaults(text)`
- Backend environment:
  - `dh2465/backend/.env` must contain:
    ```env
    SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
    # Optional: PORT=3000
    ```
  - Start server:
    ```bash
    cd dh2465/backend
    npm run dev
    ```
  - Health check: `GET http://localhost:3000/supabase/health` → `{ "configured": true }`

## Conventions
- Base URL: `http://localhost:3000`
- Allowed table types: `compensations`, `monthly_retainer`, `personnel`.
- Organization name is normalized internally: lowercased, spaces → `_`, non-alphanumeric removed. Example: `test_förening` → `test_forening` → tables like `test_forening_compensations`.

## Write Endpoints (Database-Manipulating)

### 1) Create per-organization tables
- Method: POST
- Path: `/api/org/:org/tables/create`
- Purpose: Creates three tables for the organization (id UUID, created_at, plus text columns).
- Headers: `Content-Type: application/json`
- Body (optional): override columns per table (all columns are created as TEXT):
  ```json
  {
    "compensations": ["Upplagd av","Avser Mån/år","Ledare","Kostnadsställe","Aktivitetstyp","Antal","Ersättning","Eventuell kommentar","Datum utbet"],
    "monthly_retainer": ["Ledare","KS","Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec","Summa","Semers","TOTALT","Soc avg","TOT KLUBB"],
    "personnel": ["Upplagd av","Personnummer","Förnamn","Efternamn","Clearingnr","Bankkonto","Adress","Postnr","Postort","E-post","Kostnadsställe","Ändringsdag","Månad","Timme","Heldag","Annan","Kommentar"]
  }
  ```
- Example:
  ```bash
  curl -X POST "http://localhost:3000/api/org/test_förening/tables/create" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```
- Success:
  ```json
  {
    "created": [
      "test_forening_compensations",
      "test_forening_monthly_retainer",
      "test_forening_personnel"
    ]
  }
  ```

### 2) Bulk upload Excel/CSV to a specific table
- Method: POST
- Path: `/api/org/:org/:type/upload`
- Query: optional `headerRow=2` (use when headers are on the second row)
- Body: `multipart/form-data` with a file (recommended field name: `file`; other names accepted)
- Example:
  ```bash
  curl -X POST "http://localhost:3000/api/org/test_förening/compensations/upload" \
    -F file=@/absolute/path/to/compensations.xlsx
  ```
- Success:
  ```json
  { "table": "test_forening_compensations", "inserted": 123 }
  ```
- Notes:
  - Only expected columns are retained; missing expected columns are inserted as `null`.
  - Supported `:type` values: `compensations`, `monthly_retainer`, `personnel`.

### 3) Insert a single row (per table)
- Method: POST
- Paths:
  - `/api/org/:org/compensations`
  - `/api/org/:org/monthly_retainer`
  - `/api/org/:org/personnel`
- Headers: `Content-Type: application/json`
- Body: JSON object with keys matching the exact column headers for that table.
- Example (compensations):
  ```bash
  curl -X POST "http://localhost:3000/api/org/test_förening/compensations" \
    -H 'Content-Type: application/json' \
    -d '{
      "Upplagd av": "Anna",
      "Avser Mån/år": "2025-09",
      "Ledare": "Ola",
      "Kostnadsställe": "123",
      "Antal": "2",
      "Ersättning": "500",
      "Eventuell kommentar": "test",
      "Datum utbet": "2025-09-01"
    }'
  ```
- Success: `{ "table": "...", "inserted": 1 }`

### 4) Update a row by id
- Method: PATCH
- Path: `/api/org/:org/:type/:id`
- Headers: `Content-Type: application/json`
- Body: partial object with any subset of valid columns.
- Example:
  ```bash
  curl -X PATCH "http://localhost:3000/api/org/test_förening/compensations/<row-uuid>" \
    -H 'Content-Type: application/json' \
    -d '{ "Ersättning": "600", "Eventuell kommentar": "adjusted" }'
  ```
- Success: `{ "table": "...", "id": "...", "updated": 1 }`

### 5) Delete a row by id
- Method: DELETE
- Path: `/api/org/:org/:type/:id`
- Example:
  ```bash
  curl -X DELETE "http://localhost:3000/api/org/test_förening/personnel/<row-uuid>"
  ```
- Success: `{ "table": "...", "id": "...", "deleted": 1 }`

## Read Endpoints (for completeness)
- GET `/api/org/:org/compensations`
- GET `/api/org/:org/monthly_retainer`
- GET `/api/org/:org/personnel`
  ```bash
  curl "http://localhost:3000/api/org/test_förening/compensations"
  ```
  Returns: `{ "table": "...", "rows": [ ... ] }`

## Expected Columns (defaults)
- `compensations`: `Upplagd av`, `Avser Mån/år`, `Ledare`, `Kostnadsställe`, `Aktivitetstyp`, `Antal`, `Ersättning`, `Eventuell kommentar`, `Datum utbet`
- `monthly_retainer`: `Ledare`, `KS`, `Jan`, `Feb`, `Mar`, `Apr`, `Maj`, `Jun`, `Jul`, `Aug`, `Sep`, `Okt`, `Nov`, `Dec`, `Summa`, `Semers`, `TOTALT`, `Soc avg`, `TOT KLUBB`
- `personnel`: `Upplagd av`, `Personnummer`, `Förnamn`, `Efternamn`, `Clearingnr`, `Bankkonto`, `Adress`, `Postnr`, `Postort`, `E-post`, `Kostnadsställe`, `Ändringsdag`, `Månad`, `Timme`, `Heldag`, `Annan`, `Kommentar`, `added_to_fortnox` (BOOLEAN, default false), `fortnox_employee_id`

## Troubleshooting
- Permission denied for schema public:
  - Ensure backend uses `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
  - Ensure functions in Supabase are `SECURITY DEFINER`. Run the ALTER statements from `table_creation.sql` comments if needed.
- `function uuid_generate_v4() does not exist`:
  - Updated SQL uses `gen_random_uuid()` and enables `pgcrypto`. Re-run `table_creation.sql` in the SQL editor.
- MulterError: Unexpected field:
  - The upload endpoint accepts any file field; prefer form-data key `file` in Postman.
- `TypeError: fetch failed`:
  - Check `SUPABASE_URL` is `.supabase.co` (not `.com`) and server is running.
- 400 invalid type/org:
  - Ensure `:type` is one of `compensations|monthly_retainer|personnel`.
- Empty/missing columns on insert:
  - Only expected columns are persisted. Missing keys are stored as `null` on bulk upload.
  - For `personnel`, `added_to_fortnox` defaults to `false` when missing.
  - Duplicate personnel email:
    - Single-row insert returns `409` with a warning if a row with the same email already exists.
    - Bulk upload will fail on duplicates due to the unique index on lower(`E-post`). If you prefer to skip duplicates during bulk load, ask to enable an upsert/ignore strategy.

---
For questions or for a ready-to-import Postman collection, ask your dev assistant to generate it based on this guide.
