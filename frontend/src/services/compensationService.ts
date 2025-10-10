// src/services/compensationService.ts
import { apiService } from "./apiService";

export async function fetchCompensations(org: string) {
  try {
    return await apiService.get(`/api/org/${org}/compensations`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Kunde inte hämta kompensationsdata";
    throw new Error(errorMsg);
  }
}
