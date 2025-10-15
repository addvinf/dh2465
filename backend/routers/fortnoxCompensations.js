import { Router } from 'express';
import { getOrRefreshAccessTokenFromSession } from './fortnoxAuth.js';

const router = Router();

function getSupabase(req) {
  return req.app.locals.supabase || null;
}

/**
 * Get the next 25th from today
 * @returns {string} Date in YYYY-MM-DD format
 */
function getNext25th() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  
  let targetDate;
  if (day < 25) {
    // If we're before the 25th this month, use this month's 25th
    targetDate = new Date(year, month, 25);
  } else {
    // If we're on or after the 25th, use next month's 25th
    targetDate = new Date(year, month + 1, 25);
  }
  
  // Format as YYYY-MM-DD
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Maps a compensation row from Supabase to Fortnox SalaryTransaction format
 * @param {Object} row - Row from test_frening_compensations table
 * @returns {Object} Fortnox SalaryTransaction object
 */
function mapCompensationToFortnoxSalaryTransaction(row) {
  // Extract and trim all fields
  const employeeId = (row['employee_id'] || '').trim() || undefined;
  const date = getNext25th(); // Always set to next 25th
  const amount = (row['Ersättning'] || '').trim() || undefined;
  const costCenter = (row['Kostnadsställe'] || '').trim() || undefined;
  const salaryCode = (row['Aktivitetstyp'] || '').trim() || undefined;
  const quantity = (row['Antal'] || '').trim() || '';
  const TextRow = ((row['Eventuell kommentar'] || '').trim() || '').substring(0, 40);

  const transaction = {
    EmployeeId: employeeId,
    Date: date,
    SalaryCode: salaryCode,
    Amount: amount,
  };

  // Add optional fields only if they have values
  if (costCenter) transaction.CostCenter = costCenter;
  if (quantity) transaction.Number = quantity;
  if (TextRow) transaction.TextRow = TextRow;

  // Remove undefined fields
  Object.keys(transaction).forEach((k) => {
    if (transaction[k] === undefined || transaction[k] === null || transaction[k] === '') {
      delete transaction[k];
    }
  });

  return transaction;
}

/**
 * Get access token from session
 */
async function getAccessToken(req) {
  return await getOrRefreshAccessTokenFromSession(req);
}

/**
 * Post a salary transaction to Fortnox
 */
async function postFortnoxSalaryTransaction(transaction, req) {
  const baseUrl = process.env.FORTNOX_API_BASE_URL || 'https://api.fortnox.se/3';
  const bearer = await getAccessToken(req);
  const clientSecret = process.env.FORTNOX_CLIENT_SECRET;

  if (!bearer || !clientSecret) {
    throw new Error('Fortnox credentials missing: authorize OAuth or set credentials');
  }

  const url = `${baseUrl}/salarytransactions`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${bearer}`,
    'Client-Secret': clientSecret,
  };
  const bodyObj = { SalaryTransaction: transaction };

  const debug = (req && req.query && String(req.query.debug).toLowerCase() === 'true') || String(process.env.FORTNOX_DEBUG).toLowerCase() === 'true';
  if (debug) {
    const sanitized = { ...headers };
    if (sanitized['Authorization']) {
      const val = String(sanitized['Authorization']);
      const token = val.replace(/^Bearer\s+/i, '');
      const masked = token && token.length > 10 ? `Bearer ${token.slice(0, 6)}...${token.slice(-4)}` : 'Bearer ****';
      sanitized['Authorization'] = masked;
    }
    if (sanitized['Client-Secret']) {
      const cs = String(sanitized['Client-Secret']);
      sanitized['Client-Secret'] = cs && cs.length > 6 ? `${cs.slice(0, 3)}...${cs.slice(-2)}` : '****';
    }
    console.log('Fortnox salary transaction request ->', { method: 'POST', url, headers: sanitized, body: bodyObj });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyObj),
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }

  if (!res.ok) {
    const errMsg = json && json.Message ? json.Message : text || `HTTP ${res.status}`;
    const error = new Error(`Fortnox salary transaction failed: ${errMsg}`);
    error.status = res.status;
    error.response = json || text;
    if (debug) {
      console.log('Fortnox response <-', { status: res.status, body: json || text });
    }
    throw error;
  }

  return json;
}

/**
 * POST /from-table
 * Push a single compensation row to Fortnox by ID
 */
router.post('/from-table', async (req, res) => {
  const supabase = getSupabase(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const id = req.body && (req.body.id ?? req.query.id);
  if (!id) return res.status(400).json({ error: 'Provide row id' });

  const { data, error } = await supabase
    .from('test_frening_compensations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Row not found' });

  if (data.added_to_fortnox === true) {
    return res.status(200).json({ skipped: true, reason: 'already added_to_fortnox', rowId: data.id });
  }

  const transaction = mapCompensationToFortnoxSalaryTransaction(data);

  // Validate required fields
  if (!transaction.EmployeeId || !transaction.Date || !transaction.SalaryCode) {
    return res.status(400).json({ 
      error: 'Missing required fields for Fortnox: EmployeeId (employee_id), Date (Datum utbet), SalaryCode (Aktivitetstyp)',
      transaction 
    });
  }

  try {
    const created = await postFortnoxSalaryTransaction(transaction, req);
    
    // Mark as added to Fortnox
    const { error: updError } = await supabase
      .from('test_frening_compensations')
      .update({ added_to_fortnox: true })
      .eq('id', data.id);

    if (updError) {
      return res.status(201).json({ 
        transaction, 
        created, 
        warning: 'Fortnox created but flag update failed', 
        flagError: updError.message 
      });
    }

    res.status(201).json({ transaction, created, updatedFlag: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.response });
  }
});

/**
 * POST /map-preview
 * Preview how a row would be mapped to Fortnox format
 */
router.post('/map-preview', async (req, res) => {
  const row = req.body && req.body.row;
  if (!row || typeof row !== 'object') return res.status(400).json({ error: 'Provide body.row with table row' });
  const transaction = mapCompensationToFortnoxSalaryTransaction(row);
  res.json({ transaction });
});

/**
 * POST /batch
 * Push multiple compensation rows to Fortnox
 * Query params: 
 *   - limit: max number of rows to process (default 100, max 1000)
 *   - dryRun: if true, only preview without posting to Fortnox
 */
router.post('/batch', async (req, res) => {
  const supabase = getSupabase(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const limitRaw = (req.query && req.query.limit) || (req.body && req.body.limit);
  const dryRunRaw = (req.query && req.query.dryRun) || (req.body && req.body.dryRun);
  const limit = Number.isFinite(Number(limitRaw)) && Number(limitRaw) > 0 ? Math.min(Number(limitRaw), 1000) : 100;
  const dryRun = String(dryRunRaw).toLowerCase() === 'true' || dryRunRaw === true;

  const { data, error } = await supabase
    .from('test_frening_compensations')
    .select('*')
    .or('added_to_fortnox.eq.false,added_to_fortnox.is.null')
    .order('id', { ascending: true })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });

  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    return res.json({ processed: 0, successes: 0, failures: 0, dryRun, items: [] });
  }

  const items = [];
  let successes = 0;
  let failures = 0;

  for (const row of rows) {
    if (row.added_to_fortnox === true) {
      items.push({ id: row.id, skipped: true, reason: 'already added' });
      continue;
    }

    const transaction = mapCompensationToFortnoxSalaryTransaction(row);
    
    // Validate required fields
    if (!transaction.EmployeeId || !transaction.Date || !transaction.SalaryCode) {
      failures += 1;
      items.push({ 
        id: row.id, 
        error: 'Missing required fields: EmployeeId (employee_id), Date (Datum utbet), or SalaryCode (Aktivitetstyp)',
        transaction
      });
      continue;
    }

    if (dryRun) {
      successes += 1;
      items.push({ id: row.id, dryRun: true, transaction });
      continue;
    }

    try {
      const created = await postFortnoxSalaryTransaction(transaction, req);
      
      // Mark as added
      const { error: updError } = await supabase
        .from('test_frening_compensations')
        .update({ added_to_fortnox: true })
        .eq('id', row.id);

      if (updError) {
        successes += 1; // Fortnox created, but flag failed
        items.push({ id: row.id, created, flagUpdated: false, flagError: updError.message });
        continue;
      }

      successes += 1;
      items.push({ id: row.id, created, flagUpdated: true });
    } catch (e) {
      failures += 1;
      items.push({ 
        id: row.id, 
        error: e && e.message ? e.message : 'Unknown error', 
        details: e && e.response ? e.response : undefined 
      });
    }
  }

  res.json({ processed: rows.length, successes, failures, dryRun, items });
});

export default router;

