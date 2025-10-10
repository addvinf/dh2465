// src/services/monthlyRetainerService.ts
import { apiService } from "./apiService";

export async function fetchMonthlyRetainer(org: string) {
  try {
    return await apiService.get(`/api/org/${org}/monthly_retainer`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Kunde inte hämta månad-data";
    throw new Error(errorMsg);
  }
}
