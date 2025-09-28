export async function fetchPersonnel(org: string): Promise<{ headers: string[]; rows: any[][] }> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/personnel`);
  if (!res.ok) throw new Error("Kunde inte hämta data från backend");
  const data = await res.json();

  // Extract headers from the first row (excluding id, created_at)
  if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
    return { headers: [], rows: [] };
  }
  const firstRow = data.rows[0];
  const headers = Object.keys(firstRow).filter(
    (key) => key !== "id" && key !== "created_at"
  );
  const rows = data.rows.map((row: { [x: string]: any; }) =>
    headers.map((header) => row[header])
  );
  return { headers, rows };
}

export async function addPersonnel(org: string, person: Record<string, any>) {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/personnel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Kunde inte lägga till person");
  return await res.json();
}