import type { PersonnelRecord } from "../types/personnel";

export async function fetchPersonnel(org: string): Promise<{ data: PersonnelRecord[]; count: number }> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/personnel`);
  if (!res.ok) throw new Error("Kunde inte hämta data från backend");
  const response = await res.json();

  // Return structured data
  return {
    data: response.rows || [],
    count: response.rows?.length || 0
  };
}

export async function addPersonnel(org: string, person: Partial<PersonnelRecord>): Promise<PersonnelRecord> {
  // Set default values for new fields
  const personWithDefaults = {
    Aktiv: true, // Default to active
    Befattning: person.Befattning || "",
    "Skattesats": person["Skattesats"] || 30,
    "Sociala Avgifter": person["Sociala Avgifter"] || true,
    ...person,
  };

  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/personnel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(personWithDefaults),
  });
  if (!res.ok) throw new Error("Kunde inte lägga till person");
  return await res.json();
}

export async function updatePersonnel(org: string, id: string, person: Partial<PersonnelRecord>): Promise<PersonnelRecord> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/personnel/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Kunde inte uppdatera person");
  return await res.json();
}

export async function togglePersonnelStatus(org: string, id: string): Promise<PersonnelRecord> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/personnel/${id}/toggle-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Kunde inte ändra status");
  const response = await res.json();
  return response.data || response;
}

export async function deletePersonnel(org: string, id: string): Promise<void> {
  const res = await fetch(`http://localhost:3000/api/org/${encodeURIComponent(org)}/personnel/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Kunde inte ta bort person");
}