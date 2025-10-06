import type { CompensationRecord, PersonCompensation, CompensationPeriod } from "../types/compensation";

export function groupCompensationsByPerson(
  compensations: CompensationRecord[], 
  filterPeriod?: string
): PersonCompensation[] {
  // Filter by period if specified (format: "YYYY-MM")
  const filteredCompensations = filterPeriod 
    ? compensations.filter(comp => comp["Avser Mån/år"] === filterPeriod)
    : compensations;

  // Group by personnel name
  const grouped = filteredCompensations.reduce((acc, compensation) => {
    const personnelName = compensation.Ledare;
    
    if (!acc[personnelName]) {
      acc[personnelName] = {
        personnelId: compensation.id || "", // We might need to link this properly
        personnelName,
        totalCompensation: 0,
        compensations: [],
      };
    }
    
    acc[personnelName].compensations.push(compensation);
    acc[personnelName].totalCompensation += compensation["Total ersättning"] || 0;
    
    return acc;
  }, {} as Record<string, PersonCompensation>);

  // Convert to array and sort by total compensation (highest first)
  return Object.values(grouped).sort((a, b) => b.totalCompensation - a.totalCompensation);
}

export function generatePeriodOptions(monthsBack = 12, monthsForward = 3): CompensationPeriod[] {
  const periods: CompensationPeriod[] = [];
  const currentDate = new Date();

  for (let i = -monthsBack; i <= monthsForward; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    periods.push({
      month,
      year,
      label: date.toLocaleDateString("sv-SE", { month: "long", year: "numeric" }),
    });
  }

  return periods;
}

export function formatPeriodValue(period: CompensationPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

export function getCurrentPeriod(): CompensationPeriod {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    label: now.toLocaleDateString("sv-SE", { month: "long", year: "numeric" }),
  };
}

export function calculateCompensationTotal(compensations: CompensationRecord[]): number {
  return compensations.reduce((total, comp) => total + (comp["Total ersättning"] || 0), 0);
}

export function validateCompensationRecord(record: Partial<CompensationRecord>): string[] {
  const errors: string[] = [];

  if (!record.Ledare) {
    errors.push("Ledare är obligatorisk");
  }

  if (!record["Avser Mån/år"]) {
    errors.push("Avser Mån/år är obligatorisk");
  }

  if (!record.Kostnadsställe) {
    errors.push("Kostnadsställe är obligatorisk");
  }

  if (!record.Aktivitetstyp) {
    errors.push("Aktivitetstyp är obligatorisk");
  }

  if (!record.Antal || record.Antal <= 0) {
    errors.push("Antal måste vara större än 0");
  }

  if (!record.Ersättning || record.Ersättning < 0) {
    errors.push("Ersättning måste vara 0 eller större");
  }

  // Validate date format if provided
  if (record["Datum utbet"] && !/^\d{4}-\d{2}-\d{2}$/.test(record["Datum utbet"])) {
    errors.push("Datum utbet måste vara i format YYYY-MM-DD");
  }

  return errors;
}