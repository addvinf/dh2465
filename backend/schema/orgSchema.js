// Central schema definition for per-organisation tables.
// Edit this file to change column names, types, defaults, and uniqueness.
// Types should be valid Postgres types, e.g. 'TEXT', 'BOOLEAN', 'NUMERIC', 'DATE'.

export const orgTableSchemas = {
  compensations: [
    { name: 'Upplagd av', type: 'TEXT' },
    { name: 'Avser Mån/år', type: 'TEXT' },
    { name: 'Ledare', type: 'TEXT' },
    { name: 'employee_id', type: 'TEXT' },
    { name: 'Kostnadsställe', type: 'TEXT' },
    { name: 'Aktivitetstyp', type: 'TEXT' },
    { name: 'Antal', type: 'TEXT' },
    { name: 'Ersättning', type: 'TEXT' },
    { name: 'Eventuell kommentar', type: 'TEXT' },
    { name: 'Datum utbet', type: 'TEXT' },
  ],
  monthly_retainer: [
    { name: 'Ledare', type: 'TEXT' },
    { name: 'KS', type: 'TEXT' },
    { name: 'Jan', type: 'TEXT' },
    { name: 'Feb', type: 'TEXT' },
    { name: 'Mar', type: 'TEXT' },
    { name: 'Apr', type: 'TEXT' },
    { name: 'Maj', type: 'TEXT' },
    { name: 'Jun', type: 'TEXT' },
    { name: 'Jul', type: 'TEXT' },
    { name: 'Aug', type: 'TEXT' },
    { name: 'Sep', type: 'TEXT' },
    { name: 'Okt', type: 'TEXT' },
    { name: 'Nov', type: 'TEXT' },
    { name: 'Dec', type: 'TEXT' },
    { name: 'Summa', type: 'TEXT' },
    { name: 'Semers', type: 'TEXT' },
    { name: 'TOTALT', type: 'TEXT' },
    { name: 'Soc avg', type: 'TEXT' },
    { name: 'TOT KLUBB', type: 'TEXT' },
  ],
  personnel: [
    { name: 'Upplagd av', type: 'TEXT' },
    { name: 'Personnummer', type: 'TEXT' },
    { name: 'Förnamn', type: 'TEXT' },
    { name: 'Efternamn', type: 'TEXT' },
    { name: 'Clearingnr', type: 'TEXT' },
    { name: 'Bankkonto', type: 'TEXT' },
    { name: 'Adress', type: 'TEXT' },
    { name: 'Postnr', type: 'TEXT' },
    { name: 'Postort', type: 'TEXT' },
    { name: 'E-post', type: 'TEXT', unique: true, uniqueCaseInsensitive: true },
    { name: 'Kostnadsställe', type: 'TEXT' },
    { name: 'Befattning', type: 'TEXT' },
    { name: 'Ändringsdag', type: 'TEXT' },
    { name: 'Månad', type: 'TEXT' },
    { name: 'Timme', type: 'TEXT' },
    { name: 'Heldag', type: 'TEXT' },
    { name: 'Annan', type: 'TEXT' },
    { name: 'Kommentar', type: 'TEXT' },
    { name: 'added_to_fortnox', type: 'BOOLEAN', default: false },
    { name: 'fortnox_id', type: 'TEXT' },
    { name: 'fortnox_employee_id', type: 'TEXT' },
    { name: 'Aktiv', type: 'BOOLEAN', default: true },
    { name: 'Skattesats', type: 'NUMERIC', default: 0 },
    { name: 'Sociala Avgifter', type: 'BOOLEAN', default: false }
  ],
};

export function getSchema(type) {
  if (!Object.prototype.hasOwnProperty.call(orgTableSchemas, type)) {
    throw new Error(`Unknown table type: ${type}`);
  }
  return orgTableSchemas[type];
}

export function getColumnNames(type) {
  return getSchema(type).map((c) => c.name);
}

export function getColumnTypes(type) {
  return getSchema(type).map((c) => c.type);
}

export function getColumnDefaults(type) {
  return getSchema(type).map((c) => {
    if (Object.prototype.hasOwnProperty.call(c, 'default')) {
      return c.default;
    }
    return null;
  });
}

export function normalizeRecord(type, record) {
  const cols = getSchema(type);
  const out = {};
  for (const col of cols) {
    const k = col.name;
    if (Object.prototype.hasOwnProperty.call(record, k)) {
      out[k] = record[k];
    } else if (Object.prototype.hasOwnProperty.call(col, 'default')) {
      out[k] = col.default;
    } else {
      out[k] = null;
    }
  }
  return out;
}

// ---------- SQL array literal helpers (copy/paste into SQL editor) ----------
function escapeSqlString(s) {
  return String(s).replaceAll("'", "''");
}

function stringifyDefaultValue(value) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, 'raw')) {
    return `RAW:${String(value.raw)}`;
  }
  return String(value);
}

export function toSqlArrayLiteral(items) {
  const parts = items.map((v) => `'${escapeSqlString(v)}'`);
  return `ARRAY[${parts.join(', ')}]`;
}

export function sqlArrayForColumnNames(type) {
  return toSqlArrayLiteral(getColumnNames(type));
}

export function sqlArrayForColumnTypes(type) {
  return toSqlArrayLiteral(getColumnTypes(type));
}

export function sqlArrayForColumnDefaults(type) {
  const defaults = getColumnDefaults(type).map((val) => stringifyDefaultValue(val));
  const parts = defaults.map((expr) => (expr === null ? 'NULL' : `'${escapeSqlString(expr)}'`));
  return `ARRAY[${parts.join(', ')}]::TEXT[]`;
}

export function sqlArraysAll() {
  const out = {};
  for (const type of Object.keys(orgTableSchemas)) {
    out[type] = {
      names: sqlArrayForColumnNames(type),
      types: sqlArrayForColumnTypes(type),
      defaults: sqlArrayForColumnDefaults(type),
    };
  }
  return out;
}
export function getColumnDefaultStrings(type) {
  return getColumnDefaults(type).map((val) => stringifyDefaultValue(val));
}
//node -e "import('./schema/orgSchema.js').then(m => { console.log(m.sqlCreateOrgTablesCall('test_förening')); })"
export function sqlCreateOrgTablesCall(orgName) {
  const a = sqlArraysAll();
  const orgEsc = escapeSqlString(orgName);
  return (
    `SELECT create_org_tables(\n` +
    `  '${orgEsc}',\n` +
    `  ${a.compensations.names}, ${a.compensations.types}, ${a.compensations.defaults},\n` +
    `  ${a.monthly_retainer.names}, ${a.monthly_retainer.types}, ${a.monthly_retainer.defaults},\n` +
    `  ${a.personnel.names}, ${a.personnel.types}, ${a.personnel.defaults}\n` +
    `);`
  );
}

// ---------- SQL generator for schema_* functions block (for table_creation.sql) ----------
function toSqlTextArrayLiteral(items) {
  // Returns ARRAY['a','b']::TEXT[] with proper escaping
  return `${toSqlArrayLiteral(items)}::TEXT[]`;
}

function sqlSchemaColsFunction(type) {
  const names = getColumnNames(type);
  return (
    `CREATE OR REPLACE FUNCTION schema_${type}_cols()\n` +
    `RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$\n` +
    `  SELECT ${toSqlTextArrayLiteral(names)};\n` +
    `$$;\n`
  );
}

function sqlSchemaTypesFunction(type) {
  const types = getColumnTypes(type);
  return (
    `CREATE OR REPLACE FUNCTION schema_${type}_types()\n` +
    `RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$\n` +
    `  SELECT ${toSqlTextArrayLiteral(types)};\n` +
    `$$;\n`
  );
}

function sqlSchemaDefaultsFunction(type) {
  const defaults = getColumnDefaults(type).map((val) => stringifyDefaultValue(val));
  const parts = defaults.map((expr) => (expr === null ? 'NULL' : `'${escapeSqlString(expr)}'`));
  return (
    `CREATE OR REPLACE FUNCTION schema_${type}_defaults()\n` +
    `RETURNS TEXT[] LANGUAGE SQL IMMUTABLE AS $$\n` +
    `  SELECT ARRAY[${parts.join(', ')}]::TEXT[];\n` +
    `$$;\n`
  );
}
//node -e "import('./schema/orgSchema.js').then(m => { console.log(m.sqlSchemaFunctionsBlock()); })"
export function sqlSchemaFunctionsBlock() {
  // Generates the whole block for the three schema_* functions pairs, matching our SQL style.
  const order = ['compensations', 'monthly_retainer', 'personnel'];
  const sections = [
    `-- 2) SQL-level schema arrays (single place to edit within SQL)\n`,
  ];
  for (const type of order) {
    const title = type === 'monthly_retainer' ? 'MONTHLY RETAINER' : type.toUpperCase();
    sections.push(`-- ${title}\n`);
    sections.push(sqlSchemaColsFunction(type));
    sections.push(sqlSchemaTypesFunction(type));
    sections.push(sqlSchemaDefaultsFunction(type));
  }
  return sections.join('');
}
