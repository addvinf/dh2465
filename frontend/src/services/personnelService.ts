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
    ...person,
    // Ensure Aktiv is always true for new persons
    Aktiv: true,
  };

  return await apiService.post<PersonnelRecord>(`/api/org/${encodeURIComponent(org)}/personnel`, personWithDefaults);
}

export async function updatePersonnel(org: string, id: string, person: Partial<PersonnelRecord>): Promise<PersonnelRecord> {
  return await apiService.patch<PersonnelRecord>(`/api/org/${encodeURIComponent(org)}/personnel/${id}`, person);
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