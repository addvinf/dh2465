## dh2465 Node + Express + Supabase (ESM)

### Setup
- Node 18+ recommended (project uses ESM).
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

Example insert:

```bash
curl -X POST http://localhost:3000/supabase-example \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice"}'
```

### Notes
- Dependencies and scripts live in this `dh2465` folder.
- Uses `@supabase/supabase-js`; no raw SQL (safe from injection).


