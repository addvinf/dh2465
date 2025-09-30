// src/services/compensationService.ts


export async function fetchCompensations(org: string) {
  const res = await fetch(`http://localhost:3000/api/org/${org}/compensations`);
  if (!res.ok) {
    let errorMsg = "Kunde inte hämta kompensationsdata";
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg += ": " + errData.error;
    } catch {}
    throw new Error(errorMsg);
  }
  return await res.json();
}
