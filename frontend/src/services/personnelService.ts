import type { PersonnelRecord } from "../types/personnel";
import { apiService } from "./apiService";

export async function fetchPersonnel(org: string): Promise<{ data: PersonnelRecord[]; count: number }> {
  const response = await apiService.get<{ rows: PersonnelRecord[] }>(`/api/org/${encodeURIComponent(org)}/personnel`);

  // Return structured data
  return {
    data: response.rows || [],
    count: response.rows?.length || 0
  };
}

function generateEmployeeId(): string {
  // Generate a unique 8-character employee ID (letters and numbers)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function addPersonnel(org: string, person: Partial<PersonnelRecord>): Promise<PersonnelRecord> {
  // Set default values for new fields
  const personWithDefaults = {
    Befattning: person.Befattning || "",
    "Skattesats": person["Skattesats"] || 30,
    "Sociala Avgifter": person["Sociala Avgifter"] !== undefined ? person["Sociala Avgifter"] : true,
    "Ändringsdag": person["Ändringsdag"] || new Date().toISOString().split('T')[0], // Default to today
    "Månad": person["Månad"] || 0,
    "Timme": person["Timme"] || 0,
    "Heldag": person["Heldag"] || 0,
    // Generate employee ID if not provided
    "fortnox_employee_id": person["fortnox_employee_id"] || generateEmployeeId(),
    ...person,
    // Ensure Aktiv is always true for new persons
    Aktiv: true,
  };

  await apiService.post(`/api/org/${encodeURIComponent(org)}/personnel`, personWithDefaults);
  // Backend returns { table, inserted: 1 }, not the created record
  return { ...personWithDefaults, id: crypto.randomUUID() } as PersonnelRecord;
}

export async function updatePersonnel(org: string, id: string, person: Partial<PersonnelRecord>): Promise<PersonnelRecord> {
  await apiService.patch(`/api/org/${encodeURIComponent(org)}/personnel/${id}`, person);
  // Backend returns { table, id, updated: 1 }, not the updated record
  return { ...person, id } as PersonnelRecord;
}

export async function togglePersonnelStatus(org: string, id: string): Promise<PersonnelRecord> {
  const response = await apiService.patch<{ data?: PersonnelRecord } | PersonnelRecord>(`/api/org/${encodeURIComponent(org)}/personnel/${id}/toggle-status`);
  return (response as { data: PersonnelRecord }).data || (response as PersonnelRecord);
}

export async function deletePersonnel(org: string, id: string): Promise<void> {
  await apiService.delete<void>(`/api/org/${encodeURIComponent(org)}/personnel/${id}`);
}

export async function bulkUpdatePersonnel(
  org: string,
  personnelData: Partial<PersonnelRecord>[]
): Promise<{ added: number; updated: number; errors: string[] }> {
  return await apiService.post<{ added: number; updated: number; errors: string[] }>(
    `/api/org/${encodeURIComponent(org)}/personnel/bulk`, 
    { personnel: personnelData }
  );
}