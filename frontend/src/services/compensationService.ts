// src/services/compensationService.ts
import type { CompensationRecord, CompensationFormData } from "../types/compensation";

export async function fetchCompensations(org: string): Promise<{ data: CompensationRecord[]; count: number }> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/compensations`);
  if (!res.ok) {
    let errorMsg = "Kunde inte hämta kompensationsdata";
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg += ": " + errData.error;
    } catch {}
    throw new Error(errorMsg);
  }
  const response = await res.json();
  
  // Return structured data
  return {
    data: response.rows || [],
    count: response.rows?.length || 0
  };
}

export async function addCompensation(org: string, compensation: CompensationFormData): Promise<CompensationRecord> {
  // Calculate total compensation
  const compensationWithTotal = {
    ...compensation,
    "Total ersättning": compensation.Antal * compensation.Ersättning,
    "Fortnox status": "pending" as const,
  };

  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/compensations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(compensationWithTotal),
  });
  if (!res.ok) throw new Error("Kunde inte lägga till ersättning");
  return await res.json();
}

export async function updateCompensation(org: string, id: string, compensation: Partial<CompensationFormData>): Promise<CompensationRecord> {
  // Recalculate total if quantity or rate changed
  const updates = { ...compensation };
  if (updates.Antal !== undefined && updates.Ersättning !== undefined) {
    updates["Total ersättning"] = updates.Antal * updates.Ersättning;
  }

  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/compensations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Kunde inte uppdatera ersättning");
  return await res.json();
}

export async function deleteCompensation(org: string, id: string): Promise<void> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/compensations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Kunde inte ta bort ersättning");
}

export async function bulkUpdateCompensations(
  org: string,
  compensationData: Partial<CompensationRecord>[]
): Promise<{ added: number; updated: number; errors: string[] }> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/compensations/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compensations: compensationData }),
  });
  
  if (!res.ok) throw new Error("Kunde inte genomföra bulk-uppdatering");
  return await res.json();
}
