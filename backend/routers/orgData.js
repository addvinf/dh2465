import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function normalizeName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

const TABLE_TYPES = new Set(['compensations', 'monthly_retainer', 'personnel']);
const EXPECTED_COLUMNS = {
  compensations: [
    'Upplagd av',
    'Avser Mån/år',
    'Ledare',
    'Kostnadsställe',
    'Aktivitetstyp',
    'Antal',
    'Ersättning',
    'Eventuell kommentar',
    'Datum utbet',
  ],
  monthly_retainer: [
    'Ledare','KS','Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec','Summa','Semers','TOTALT','Soc avg','TOT KLUBB'
  ],
  personnel: [
    'Upplagd av','Personnummer','Förnamn','Efternamn','Clearingnr','Bankkonto','Adress','Postnr','Postort','E-post','Kostnadsställe','Ändringsdag','Månad','Timme','Heldag','Annan','Kommentar'
  ],
};

function sheetToJson(sheet, opts = {}) {
  return XLSX.utils.sheet_to_json(sheet, { defval: null, ...opts });
}

function keepOriginalKeys(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = String(k).trim();
    if (!key) continue;
    out[key] = v;
  }
  return out;
}

function filterToExpected(type, record) {
  const cols = EXPECTED_COLUMNS[type];
  const out = {};
  for (const c of cols) {
    if (Object.prototype.hasOwnProperty.call(record, c)) {
      out[c] = record[c];
    } else {
      out[c] = null;
    }
  }
  return out;
}

async function bulkInsert(supabase, table, rows) {
  if (!rows.length) return { count: 0 };
  const { error } = await supabase.from(table).insert(rows, { returning: 'minimal' });
  if (error) throw new Error(error.message || String(error));
  return { count: rows.length };
}

// Upload endpoint: POST /org/:org/:type/upload
// Body: multipart/form-data with a file field (recommended name: "file")
// Accept any file field to avoid "Unexpected field" errors from clients
router.post('/org/:org/:type/upload', upload.any(), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const orgRaw = req.params.org;
    const org = normalizeName(orgRaw);
    if (!org) return res.status(400).json({ error: 'Invalid organisation name' });

    const tableType = String(req.params.type || '').trim().toLowerCase();
    if (!TABLE_TYPES.has(tableType)) return res.status(400).json({ error: 'Invalid type. Use compensations|monthly_retainer|personnel' });

  // Multer `any()` places files in `req.files` (array). Support either `req.file` or first `req.files` entry.
  const uploadedFile = req.file ?? (Array.isArray(req.files) && req.files[0]) ?? null;
  const buffer = uploadedFile?.buffer;
  if (!buffer) return res.status(400).json({ error: 'Missing file. Send multipart/form-data with a file (field name "file" recommended).' });

    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const table = `${org}_${tableType}`;

    // Choose first worksheet by default
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    // For the special case: headers on the second row (e.g., personal förening x)
    // Pass header:2 to read raw rows then use row 2 as header.
    let records;
  let columnNames;
    if (req.query.headerRow === '2') {
      const rows = sheetToJson(sheet, { header: 1, defval: null });
      if (!Array.isArray(rows) || rows.length < 2) {
        return res.status(400).json({ error: 'Sheet too short to read header row 2' });
      }
      const header = rows[1].map((h) => (h == null ? '' : String(h)));
      const dataRows = rows.slice(2);
      const sanitizedHeader = header.map((h) => String(h).trim());
      columnNames = sanitizedHeader.filter(Boolean);
      records = dataRows.map((r) => {
        const obj = {};
        sanitizedHeader.forEach((key, idx) => {
          if (!key) return; // skip empty column names
          obj[key] = r[idx] ?? null;
        });
        return obj;
      });
    } else {
      // Normal case: first row contains headers. Keep exact keys.
      const tmp = sheetToJson(sheet, { defval: null });
      records = tmp.map((r) => keepOriginalKeys(r));
      columnNames = tmp.length ? Object.keys(tmp[0]).map((k) => String(k).trim()).filter(Boolean) : [];
    }

    // Remove all-null rows
    records = records.filter((row) => Object.values(row).some((v) => v !== null && v !== ''));

  // Keep only expected columns and fill missing as null
  records = records.map((r) => filterToExpected(tableType, r));

    const result = await bulkInsert(supabase, table, records);
    res.json({ table, inserted: result.count });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// Visualize endpoints
router.get('/org/:org/compensations', async (req, res) => {
  await listTable(req, res, 'compensations');
});
router.get('/org/:org/monthly_retainer', async (req, res) => {
  await listTable(req, res, 'monthly_retainer');
});
router.get('/org/:org/personnel', async (req, res) => {
  await listTable(req, res, 'personnel');
});

async function listTable(req, res, type) {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const org = normalizeName(req.params.org);
    if (!org) return res.status(400).json({ error: 'Invalid organisation name' });
    const table = `${org}_${type}`;

    const { data, error } = await supabase.from(table).select('*').limit(500);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ table, rows: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}

// Insert single row endpoints for frontend forms
router.post('/org/:org/compensations', async (req, res) => {
  await insertRow(req, res, 'compensations');
});
router.post('/org/:org/monthly_retainer', async (req, res) => {
  await insertRow(req, res, 'monthly_retainer');
});
router.post('/org/:org/personnel', async (req, res) => {
  await insertRow(req, res, 'personnel');
});

async function insertRow(req, res, type) {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const org = normalizeName(req.params.org);
    if (!org) return res.status(400).json({ error: 'Invalid organisation name' });
    const table = `${org}_${type}`;

    const payloadRaw = keepOriginalKeys(req.body || {});
    // Filter to expected columns only
    const cols = EXPECTED_COLUMNS[type];
    const payload = {};
    for (const c of cols) {
      if (Object.prototype.hasOwnProperty.call(payloadRaw, c)) {
        payload[c] = payloadRaw[c];
      }
    }

    const { error } = await supabase.from(table).insert(payload, { returning: 'representation' });
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ table, inserted: 1 });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}

// Edit a row by id
router.patch('/org/:org/:type/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const org = normalizeName(req.params.org);
    const type = String(req.params.type || '').trim().toLowerCase();
    if (!TABLE_TYPES.has(type)) return res.status(400).json({ error: 'Invalid type. Use compensations|monthly_retainer|personnel' });
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const table = `${org}_${type}`;
    const payloadRaw = keepOriginalKeys(req.body || {});
    const cols = EXPECTED_COLUMNS[type];
    const payload = {};
    for (const c of cols) {
      if (Object.prototype.hasOwnProperty.call(payloadRaw, c)) {
        payload[c] = payloadRaw[c];
      }
    }

    const { error } = await supabase.from(table).update(payload).eq('id', id).limit(1);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ table, id, updated: 1 });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// Delete a row by id
router.delete('/org/:org/:type/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const org = normalizeName(req.params.org);
    const type = String(req.params.type || '').trim().toLowerCase();
    if (!TABLE_TYPES.has(type)) return res.status(400).json({ error: 'Invalid type. Use compensations|monthly_retainer|personnel' });
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const table = `${org}_${type}`;
    const { error } = await supabase.from(table).delete().eq('id', id).limit(1);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ table, id, deleted: 1 });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// Create empty tables (id, created_at) for an organisation, optionally with provided columns
// POST /org/:org/tables/create
// Body (optional):
// {
//   "compensations": ["col1", "col2"],
//   "monthly_retainer": ["..."],
//   "personnel": ["..."]
// }
router.post('/org/:org/tables/create', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const org = normalizeName(req.params.org);
    if (!org) return res.status(400).json({ error: 'Invalid organisation name' });

    const body = req.body || {};
    let comp_cols = Array.isArray(body.compensations) ? body.compensations.map(String) : [];
    let ret_cols  = Array.isArray(body.monthly_retainer) ? body.monthly_retainer.map(String) : [];
    let pers_cols = Array.isArray(body.personnel) ? body.personnel.map(String) : [];

    // If not provided, use CSV template defaults
    if (comp_cols.length === 0) {
      comp_cols = [
        'Upplagd av','Avser Mån/år','Ledare','Kostnadsställe','Aktivitetstyp','Antal','Ersättning','Eventuell kommentar','Datum utbet'
      ];
    }
    if (ret_cols.length === 0) {
      ret_cols = [
        'Ledare','KS','Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec','Summa','Semers','TOTALT','Soc avg','TOT KLUBB'
      ];
    }
    if (pers_cols.length === 0) {
      pers_cols = [
        'Upplagd av','Personnummer','Förnamn','Efternamn','Clearingnr','Bankkonto','Adress','Postnr','Postort','E-post','Kostnadsställe','Ändringsdag','Månad','Timme','Heldag','Annan','Kommentar'
      ];
    }

    const comp_types = comp_cols.map(() => 'text');
    const ret_types  = ret_cols.map(() => 'text');
    const pers_types = pers_cols.map(() => 'text');

    const { error } = await supabase.rpc('create_org_tables', {
      org_name: org,
      comp_cols,
      comp_types,
      ret_cols,
      ret_types,
      pers_cols,
      pers_types,
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ created: [
      `${org}_compensations`,
      `${org}_monthly_retainer`,
      `${org}_personnel`,
    ]});
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

export default router;
