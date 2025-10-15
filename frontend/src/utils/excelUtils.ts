import * as XLSX from "xlsx";

export type ParsedAOA = {
  headers: string[];
  rows: any[][];
  fileName?: string;
  headerRow: number;
  rowCount: number;
};

export type ParsedObjects = {
  headers: string[];
  rows: Record<string, any>[];
  fileName?: string;
  headerRow: number;
  rowCount: number;
};

export type ParseOptions = {
  expectedHeaders?: string[];
  maxScanRows?: number; // how many top rows to scan for headers
  padRows?: boolean; // pad AOA rows to headers length
};

const DEFAULT_MAX_SCAN_ROWS = 5;

export function isExcelFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return /\.(xlsx|xls)$/i.test(lower);
}

async function getFirstWorksheet(
  file: File
): Promise<{ worksheet: XLSX.WorkSheet; sheetName: string; workbook: XLSX.WorkBook }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    // Important for date handling
    cellDates: true,
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return { worksheet, sheetName, workbook };
}

export function detectHeaderRow(
  aoa: any[][],
  expectedHeaders?: string[],
  maxScanRows: number = DEFAULT_MAX_SCAN_ROWS
): number {
  if (!Array.isArray(aoa) || aoa.length === 0) return 0;
  if (!expectedHeaders || expectedHeaders.length === 0) return 0;

  const norm = (s: any) => String(s ?? "").trim().toLowerCase();
  const expected = expectedHeaders.map(norm).filter(Boolean);
  const limit = Math.min(maxScanRows, aoa.length);

  let bestRow = 0;
  let bestScore = -1;
  for (let i = 0; i < limit; i++) {
    const row = aoa[i] as any[];
    const score = row.reduce((acc, cell) => {
      const n = norm(cell);
      // count as match if the cell resembles any expected header
      if (n && expected.some((eh) => eh === n || eh.includes(n) || n.includes(eh))) {
        return acc + 1;
      }
      return acc;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  return bestRow;
}

export function padRowTo(headersLen: number, row: any[]): any[] {
  if (!Array.isArray(row)) return Array(headersLen).fill("");
  if (row.length >= headersLen) return row.slice(0, headersLen);
  const out = Array(headersLen).fill("");
  for (let i = 0; i < row.length; i++) out[i] = row[i];
  return out;
}

export function normalizeDate(value: any): string {
  if (value == null || value === "") return "";

  const toIso = (d: Date) => {
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Already ISO
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Swedish common formats: dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy
    const m = s.match(/^(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})$/);
    if (m) {
      const [_, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}`;
    }
    // Try native parse last
    const d = new Date(s);
    return toIso(d);
  }

  if (value instanceof Date) {
    return toIso(value);
  }

  if (typeof value === "number") {
    // Excel serial date code
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    const d = new Date(parsed.y, (parsed.m || 1) - 1, parsed.d || 1);
    return toIso(d);
  }

  return "";
}

export function normalizePeriod(value: any): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${yyyy}-${mm}`;
    }
  }
  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    const yyyy = parsed.y;
    const mm = String((parsed.m || 1)).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }
  return "";
}

export async function parseSheetToAOA(
  file: File,
  opts: ParseOptions = {}
): Promise<ParsedAOA> {
  const { worksheet } = await getFirstWorksheet(file);
  const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", blankrows: false }) as any[][];
  if (!raw.length) return { headers: [], rows: [], headerRow: 0, rowCount: 0 };

  const headerRow = detectHeaderRow(raw, opts.expectedHeaders, opts.maxScanRows);
  const headers = (raw[headerRow] as any[]).map((h) => String(h ?? "").trim());
  const dataRows = raw.slice(headerRow + 1);

  const toDisplay = (v: any) => (v instanceof Date ? normalizeDate(v) : v);
  const normalized = dataRows.map((r) => (r as any[]).map(toDisplay));
  const rows = (opts.padRows ? normalized.map((r) => padRowTo(headers.length, r as any[])) : (normalized as any[][]));
  return { headers, rows, headerRow, rowCount: rows.length };
}

export async function parseSheetToObjects(
  file: File,
  opts: ParseOptions = {}
): Promise<ParsedObjects> {
  const { worksheet } = await getFirstWorksheet(file);
  const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", blankrows: false }) as any[][];
  if (!raw.length) return { headers: [], rows: [], headerRow: 0, rowCount: 0 };

  const headerRow = detectHeaderRow(raw, opts.expectedHeaders, opts.maxScanRows);
  const headers = (raw[headerRow] as any[]).map((h) => String(h ?? "").trim());
  const dataRows = raw.slice(headerRow + 1);

  const rows: Record<string, any>[] = dataRows
    .map((r) => headers.reduce<Record<string, any>>((acc, h, idx) => {
      if (!h) return acc;
      const v = (r as any[])[idx] ?? "";
      acc[h] = v instanceof Date ? normalizeDate(v) : v;
      return acc;
    }, {}))
    // filter out completely empty rows
    .filter((obj) => Object.values(obj).some((v) => String(v ?? "").trim() !== ""));

  return { headers, rows, headerRow, rowCount: rows.length };
}

export function aoaToWorksheet(headers: string[], rows: any[][]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet([headers, ...rows]);
}

export function downloadExcelAOA(fileName: string, headers: string[], rows: any[][], sheetName = "Data") {
  const ws = aoaToWorksheet(headers, rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}