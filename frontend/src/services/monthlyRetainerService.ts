// src/services/monthlyRetainerService.ts
export async function fetchMonthlyRetainer(org: string) {
  const res = await fetch(`http://localhost:3000/api/org/${org}/monthly_retainer`);
  if (!res.ok) {
    let errorMsg = "Kunde inte hämta månad-data";
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg += ": " + errData.error;
    } catch {}
    throw new Error(errorMsg);
  }
  return await res.json();
}
