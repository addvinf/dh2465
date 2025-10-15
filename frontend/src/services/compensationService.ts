// src/services/compensationService.ts
import { apiService } from "./apiService";
import type { CompensationRecord, CompensationFormData } from "../types/compensation";

/** Normalizes API errors into a readable message */
function toErrorMessage(err: unknown, fallback = "Ett oväntat fel inträffade"): string {
  if (err instanceof Error) return err.message;
  // axios-style error shape
  // @ts-expect-error – best-effort introspection of common shapes
  const msg = err?.response?.data?.error || err?.data?.error || err?.message;
  return typeof msg === "string" ? msg : fallback;
}

/** Extract rows defensively whether backend returns {rows: []} or an array directly */
function rowsFrom(data: any): CompensationRecord[] {
  if (Array.isArray(data)) return data as CompensationRecord[];
  if (Array.isArray(data?.rows)) return data.rows as CompensationRecord[];
  return [];
}

export async function fetchCompensations(
  org: string
): Promise<{ data: CompensationRecord[]; count: number }> {
  try {
    const response = await apiService.get<{ table: string; rows: CompensationRecord[] }>(`/api/org/${encodeURIComponent(org)}/compensations`);
    const rows = rowsFrom(response);
    return { data: rows, count: rows.length };
  } catch (error) {
    const errorMsg = "Kunde inte hämta kompensationsdata: " + toErrorMessage(error, "");
    throw new Error(errorMsg.trim().replace(/:\s*$/, ""));
  }
}

export async function addCompensation(
  org: string,
  compensation: CompensationFormData
): Promise<CompensationRecord> {
  try {
    // Calculate derived fields on the client to keep UI consistent
    const payload = {
      ...compensation,
      "Total ersättning": compensation.Antal * compensation.Ersättning,
      "Fortnox status": "pending" as const,
    };

    await apiService.post(
      `/api/org/${encodeURIComponent(org)}/compensations`,
      payload
    );
    // Backend returns { table, inserted: 1 }, not the created record
    // Return the payload with a generated id
    return { ...payload, id: crypto.randomUUID() } as CompensationRecord;
  } catch (error) {
    throw new Error("Kunde inte lägga till ersättning: " + toErrorMessage(error, ""));
  }
}

export async function updateCompensation(
  org: string,
  id: string,
  compensation: Partial<CompensationFormData>
): Promise<CompensationRecord> {
  try {
    const updates: Partial<CompensationFormData & { "Total ersättning": number }> = { ...compensation };

    // Recalculate total if both parts present; if only one present, leave server to recalc
    if (
      typeof updates.Antal === "number" &&
      typeof updates.Ersättning === "number"
    ) {
      updates["Total ersättning"] = updates.Antal * updates.Ersättning;
    }

    await apiService.patch(
      `/api/org/${encodeURIComponent(org)}/compensations/${encodeURIComponent(id)}`,
      updates
    );
    // Backend returns { table, id, updated: 1 }, not the updated record
    // Return the updates merged with the id
    return { ...updates, id } as CompensationRecord;
  } catch (error) {
    throw new Error("Kunde inte uppdatera ersättning: " + toErrorMessage(error, ""));
  }
}

export async function deleteCompensation(org: string, id: string): Promise<void> {
  try {
    await apiService.delete(
      `/api/org/${encodeURIComponent(org)}/compensations/${encodeURIComponent(id)}`
    );
  } catch (error) {
    throw new Error("Kunde inte ta bort ersättning: " + toErrorMessage(error, ""));
  }
}

export async function bulkUpdateCompensations(
  org: string,
  compensationData: Partial<CompensationRecord>[]
): Promise<{ added: number; updated: number; errors: string[] }> {
  try {
    const response = await apiService.post<{ added: number; updated: number; errors: string[] }>(
      `/api/org/${encodeURIComponent(org)}/compensations/bulk`,
      { compensations: compensationData }
    );
    // Expect server to return { added, updated, errors }
    const { added = 0, updated = 0, errors = [] } = response ?? {};
    return { added, updated, errors };
  } catch (error) {
    throw new Error("Kunde inte genomföra bulk-uppdatering: " + toErrorMessage(error, ""));
  }
}

export interface CompensationBatchResultItem {
  id: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
  details?: any;
  dryRun?: boolean;
  created?: unknown;
  flagUpdated?: boolean;
  flagError?: string;
}

export interface CompensationBatchResponse {
  processed: number;
  successes: number;
  failures: number;
  dryRun: boolean;
  items: CompensationBatchResultItem[];
}

/**
 * Push compensations to Fortnox in batch
 */
export async function pushCompensationsBatch(options?: { limit?: number; dryRun?: boolean }): Promise<CompensationBatchResponse> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  if (options?.dryRun !== undefined) params.set('dryRun', String(options.dryRun));

  const endpoint = `/fortnox-compensations/batch${params.toString() ? `?${params.toString()}` : ''}`;
  
  try {
    return await apiService.post<CompensationBatchResponse>(endpoint, {});
  } catch (error) {
    throw new Error(toErrorMessage(error, 'Batch push failed'));
  }
}