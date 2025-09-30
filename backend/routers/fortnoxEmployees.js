import { Router } from 'express';
import { getOrRefreshAccessTokenFromSession } from './fortnoxAuth.js';

const router = Router();

function getSupabase(req) {
  return req.app.locals.supabase || null;
}

function mapSupabaseRowToFortnoxEmployee(row) {
  const email = (row['E-post'] || '').trim() || undefined;
  const firstName = (row['Förnamn'] || '').trim() || undefined;
  const lastName = (row['Efternamn'] || '').trim() || undefined;
  const personalIdentityNumber = (row['Personnummer'] || '').trim() || undefined;
  const clearingNo = (row['Clearingnr'] || '').trim() || undefined;
  const bankAccountNo = (row['Bankkonto'] || '').trim() || undefined;
  const address1 = (row['Adress'] || '').trim() || undefined;
  const postCode = (row['Postnr'] || '').trim() || undefined;
  const city = (row['Postort'] || '').trim() || undefined;
  const costCenter = (row['Kostnadsställe'] || '').trim() || undefined;
  const employmentDate = (row['Ändringsdag'] || '').trim() || undefined;

  // Env-driven defaults for fields often required by Fortnox Salary
  const employmentForm = process.env.FORTNOX_DEFAULT_EMPLOYMENT_FORM || undefined; // TV/PRO/TID/SVT/VIK/PRJ/PRA/FER/SES/NEJ
  const salaryForm = process.env.FORTNOX_DEFAULT_SALARY_FORM || 'TIM'; // MAN/TIM
  const personelType = process.env.FORTNOX_DEFAULT_PERSONEL_TYPE || undefined; // TJM/ARB
  const scheduleId = process.env.FORTNOX_DEFAULT_SCHEDULE_ID || undefined; // String id
  const foraType = process.env.FORTNOX_DEFAULT_FORA_TYPE || undefined; // Code like 'A', 'A51', ...
  const taxAllowance = process.env.FORTNOX_DEFAULT_TAX_ALLOWANCE || undefined; // HUV/EXT/TMP/STU/EJ/???
  const taxColumn = process.env.FORTNOX_DEFAULT_TAX_COLUMN ? Number(process.env.FORTNOX_DEFAULT_TAX_COLUMN) : undefined; // 1..6
  const project = process.env.FORTNOX_DEFAULT_PROJECT || undefined;
  const country = process.env.FORTNOX_DEFAULT_COUNTRY || undefined;
  const employeeId = process.env.FORTNOX_DEFAULT_EMPLOYEE_ID || undefined; // optional explicit EmployeeId
  const scheduleAgreementId = process.env.FORTNOX_DEFAULT_FTGAVTAL_ID || process.env.FORTNOX_DEFAULT_SALARY_CONTRACT_ID || undefined; // FtgAvtalId mapping

  const employee = {
    Email: email,
    FirstName: firstName,
    LastName: lastName,
    PersonalIdentityNumber: personalIdentityNumber,
    ClearingNo: clearingNo,
    BankAccountNo: bankAccountNo,
    Address1: address1,
    PostCode: postCode,
    City: city,
    //CostCenter: costCenter,
    EmploymentDate: employmentDate,
    EmploymentForm: employmentForm,
    SalaryForm: salaryForm,
    PersonelType: personelType,
    ScheduleId: scheduleId,
    ForaType: foraType,
    TaxAllowance: taxAllowance,
    TaxColumn: taxColumn,
    Project: project,
    Country: country,
    EmployeeId: employeeId,
    PersonelType: "ARB", //TODO add by månadslön or timlön
    EmploymentDate: employmentDate
  };

  Object.keys(employee).forEach((k) => {
    if (employee[k] === undefined || employee[k] === null || employee[k] === '') {
      delete employee[k];
    }
  });

  return employee;
}

async function getAccessTokenFromApp(req) {
  return await getOrRefreshAccessTokenFromSession(req);
}

async function postFortnoxEmployee(employee, req) {
  const baseUrl = process.env.FORTNOX_API_BASE_URL || 'https://api.fortnox.se/3';
  const bearer = await getAccessTokenFromApp(req);
  const accessToken = process.env.FORTNOX_ACCESS_TOKEN;
  const clientSecret = process.env.FORTNOX_CLIENT_SECRET;

  if ((!bearer && !accessToken) || !clientSecret) {
    throw new Error('Fortnox credentials missing: authorize OAuth or set FORTNOX_ACCESS_TOKEN and FORTNOX_CLIENT_SECRET');
  }

  const url = `${baseUrl}/employees`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(bearer ? { 'Authorization': `Bearer ${bearer}` } : { 'Access-Token': accessToken }),
    'Client-Secret': clientSecret,
  };
  const bodyObj = { Employee: employee };

  const debug = (req && req.query && String(req.query.debug).toLowerCase() === 'true') || String(process.env.FORTNOX_DEBUG).toLowerCase() === 'true';
  if (debug) {
    const sanitized = { ...headers };
    if (sanitized['Authorization']) {
      const val = String(sanitized['Authorization']);
      const token = val.replace(/^Bearer\s+/i, '');
      const masked = token && token.length > 10 ? `Bearer ${token.slice(0, 6)}...${token.slice(-4)}` : 'Bearer ****';
      sanitized['Authorization'] = masked;
    }
    if (sanitized['Access-Token']) {
      const t = String(sanitized['Access-Token']);
      sanitized['Access-Token'] = t && t.length > 8 ? `${t.slice(0, 4)}...${t.slice(-3)}` : '****';
    }
    if (sanitized['Client-Secret']) {
      const cs = String(sanitized['Client-Secret']);
      sanitized['Client-Secret'] = cs && cs.length > 6 ? `${cs.slice(0, 3)}...${cs.slice(-2)}` : '****';
    }
    console.log('Fortnox request ->', { method: 'POST', url, headers: sanitized, body: bodyObj });
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
    const error = new Error(`Fortnox create employee failed: ${errMsg}`);
    error.status = res.status;
    error.response = json || text;
    if (debug) {
      console.log('Fortnox response <-', { status: res.status, body: json || text });
    }
    throw error;
  }

  return json;
}

router.post('/from-table', async (req, res) => {
  const supabase = getSupabase(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const id = req.body && (req.body.id ?? req.query.id);
  if (!id) return res.status(400).json({ error: 'Provide row id' });

  const { data, error } = await supabase
    .from('test_frening_personnel')
    .select('*')
    .eq('id', id)
    .single();

  
  console.log("data: ", data);
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Row not found' });

  if (data.added_to_fortnox === true) {
    return res.status(200).json({ skipped: true, reason: 'already added_to_fortnox', rowId: data.id });
  }

  const employee = mapSupabaseRowToFortnoxEmployee(data);

  if (!employee.Email || !employee.FirstName || !employee.LastName) {
    return res.status(400).json({ error: 'Missing required fields for Fortnox: Email, FirstName, LastName' });
  }

  try {
    const created = await postFortnoxEmployee(employee, req);
    const fortnoxEmployeeId = created && created.Employee && created.Employee.EmployeeId;
    const hasFortnoxId = fortnoxEmployeeId !== undefined && fortnoxEmployeeId !== null && String(fortnoxEmployeeId) !== '';
    const updatePayload = { added_to_fortnox: true, ...(hasFortnoxId ? { fortnox_employee_id: String(fortnoxEmployeeId), fortnox_id: String(fortnoxEmployeeId) } : {}) };

    let updError = null;
    let updated = false;
    const table = 'test_frening_personnel';
    const attempt1 = await supabase.from(table).update(updatePayload).eq('id', data.id);
    updError = attempt1.error || null;
    if (updError && /fortnox_id/i.test(String(updError.message || ''))) {
      const fallbackPayload = { added_to_fortnox: true, ...(hasFortnoxId ? { fortnox_employee_id: String(fortnoxEmployeeId) } : {}) };
      const attempt2 = await supabase.from(table).update(fallbackPayload).eq('id', data.id);
      updError = attempt2.error || null;
      updated = !updError;
    } else {
      updated = !updError;
    }

    if (updError) {
      return res.status(201).json({ employee, created, warning: 'Fortnox created but flag update failed', flagError: updError.message, fortnoxEmployeeId: hasFortnoxId ? String(fortnoxEmployeeId) : null });
    }

    res.status(201).json({ employee, created, updatedFlag: true, fortnoxEmployeeId: fortnoxEmployeeId || null });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.response });
  }
});

router.post('/map-preview', async (req, res) => {
  const row = req.body && req.body.row;
  if (!row || typeof row !== 'object') return res.status(400).json({ error: 'Provide body.row with table row' });
  const employee = mapSupabaseRowToFortnoxEmployee(row);
  res.json({ employee });
});

router.post('/batch', async (req, res) => {
  const supabase = getSupabase(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const limitRaw = (req.query && req.query.limit) || (req.body && req.body.limit);
  const dryRunRaw = (req.query && req.query.dryRun) || (req.body && req.body.dryRun);
  const limit = Number.isFinite(Number(limitRaw)) && Number(limitRaw) > 0 ? Math.min(Number(limitRaw), 1000) : 100;
  const dryRun = String(dryRunRaw).toLowerCase() === 'true' || dryRunRaw === true;

  const { data, error } = await supabase
    .from('test_frening_personnel')
    .select('*')
    .or('added_to_fortnox.eq.false,added_to_fortnox.is.null')
    .order('id', { ascending: true })
    .limit(limit);

  console.log("data: ", data);
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

    const employee = mapSupabaseRowToFortnoxEmployee(row);
    if (!employee.Email || !employee.FirstName || !employee.LastName) {
      failures += 1;
      items.push({ id: row.id, error: 'Missing required fields Email/FirstName/LastName' });
      continue;
    }

    if (dryRun) {
      successes += 1;
      items.push({ id: row.id, dryRun: true, employee });
      continue;
    }

    try {
      const created = await postFortnoxEmployee(employee, req);
      const fortnoxEmployeeId = created && created.Employee && created.Employee.EmployeeId;
      const hasFortnoxId = fortnoxEmployeeId !== undefined && fortnoxEmployeeId !== null && String(fortnoxEmployeeId) !== '';
      const updatePayload = { added_to_fortnox: true, ...(hasFortnoxId ? { fortnox_employee_id: String(fortnoxEmployeeId), fortnox_id: String(fortnoxEmployeeId) } : {}) };
      const table = 'test_frening_personnel';
      let { error: updError } = await supabase.from(table).update(updatePayload).eq('id', row.id);
      if (updError && /fortnox_id/i.test(String(updError.message || ''))) {
        const fallbackPayload = { added_to_fortnox: true, ...(hasFortnoxId ? { fortnox_employee_id: String(fortnoxEmployeeId) } : {}) };
        const retry = await supabase.from(table).update(fallbackPayload).eq('id', row.id);
        updError = retry.error || null;
      }

      if (updError) {
        successes += 1; // Fortnox created, but flag failed
        items.push({ id: row.id, created, flagUpdated: false, flagError: updError.message, fortnoxEmployeeId: hasFortnoxId ? String(fortnoxEmployeeId) : null });
        continue;
      }

      successes += 1;
      items.push({ id: row.id, created, flagUpdated: true, fortnoxEmployeeId: hasFortnoxId ? String(fortnoxEmployeeId) : null });
    } catch (e) {
      failures += 1;
      items.push({ id: row.id, error: e && e.message ? e.message : 'Unknown error', details: e && e.response ? e.response : undefined });
    }
  }

  res.json({ processed: rows.length, successes, failures, dryRun, items });
});

export default router;


