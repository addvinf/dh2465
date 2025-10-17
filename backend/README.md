## dh2465 Node + Express + Supabase (ESM)

### Setup
- Node 20+ recommended (project uses ESM). Supabase has deprecated Node 18 and below; upgrade to Node 20+.
  See: https://github.com/orgs/supabase/discussions/37217

To use Node 20 locally:

```
# with nvm
nvm install 20 && nvm use 20

# with asdf
asdf install nodejs 20.0.0 && asdf local nodejs 20.0.0

# with volta
volta install node@20
```
- In this folder:

```bash
npm install
```

Create `.env` in `dh2465/`:

```bash
SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
# Use one of the keys below (prefer service role on backend)
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
# SUPABASE_ANON_KEY="YOUR_ANON_KEY"
# PORT=3000
```

### Run

```bash
npm run dev
```

### Endpoints
- `GET /` → status message
- `GET /hello` → `{ message: "Hello, world!" }`
- `GET /supabase/health` → `{ configured: boolean }`
- `GET /supabase-example` → list rows from `public.database_test`
- `POST /supabase-example` → insert row

#### Admin endpoints (require global_admin role)
- `POST /admin/organizations` → Create an organization registry entry and its three per-org tables
  - Body: `{ "name": "Förening X" }`
- `POST /admin/organizations/:org/admins` → Assign an org admin by email for `:org`
  - Body: `{ "email": "user@example.com" }`

#### Org data API
- `POST /api/org/:org/tables/create` — Create the three tables for the organisation. Optional JSON body to predefine columns (all text unless changed in SQL).
- `POST /api/org/:org/:type/upload[?headerRow=2]` — Upload an Excel file for a specific table type (`compensations|monthly_retainer|personnel`). Form field `file` must contain the file. If `headerRow=2` the second row is treated as header (for the personal förening x file). Missing columns are auto-added as text via RPC.
- `GET /api/org/:org/compensations` — Preview/visualize first 500 rows of the compensations table for the org.
- `GET /api/org/:org/monthly_retainer` — Preview/visualize first 500 rows of the monthly retainer table for the org.
- `GET /api/org/:org/personnel` — Preview/visualize first 500 rows of the personnel table for the org.
- `POST /api/org/:org/compensations` — Insert a single row (JSON body, keys in any case; they will be snake_cased).
- `POST /api/org/:org/monthly_retainer` — Insert a single row (JSON body).
- `POST /api/org/:org/personnel` — Insert a single row (JSON body).
 - `PATCH /api/org/:org/:type/:id` — Update a single row by id.
 - `DELETE /api/org/:org/:type/:id` — Delete a single row by id.

Create tables then upload example:
```bash
# create tables (optionally pass prototype columns in JSON)
curl -X POST "http://localhost:3000/api/org/acme/tables/create"

# upload to a specific type
curl -X POST "http://localhost:3000/api/org/acme/compensations/upload" \
  -F file=@/path/to/compensations.xlsx
```

Insert one row example:
```bash
curl -X POST http://localhost:3000/api/org/acme/personnel \
  -H 'Content-Type: application/json' \
  -d '{"Name":"Alice","Role":"Coach","Hours":8}'
```

Example insert:

```bash
curl -X POST http://localhost:3000/supabase-example \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice"}'
```

### Notes
- Dependencies and scripts live in this `dh2465` folder.
- Uses `@supabase/supabase-js`; no raw SQL (safe from injection).
 - See `supabase_sql/table_creation.sql` for SQL helpers you can paste into Supabase to create per-organisation tables with `id` primary key and `created_at`.

Auth context:
- Tokens are verified with Supabase. We attach `{ id, email, role, organizations }` to `req.user`.
- `role` and `organizations` are read from Supabase app_metadata (fallback to user_metadata). Prefer storing trusted fields in `app_metadata`.


