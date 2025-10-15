// Compensation data types based on Swedish compensation system

export interface CompensationRecord {
  id?: string;
  "Upplagd av": string; // Contact person from settings
  "Avser Mån/år": string; // Period (Month/Year)
  "Ledare": string; // Personnel name
  "employee_id": string; // Fortnox employee ID from personnel
  "Kostnadsställe": string; // Cost center code (number) from settings
  "Aktivitetstyp": string; // Salary type code (number as string) from settings
  "Antal": number; // Quantity
  "Ersättning": number; // Compensation per unit
  "Total ersättning"?: number; // Calculated: Antal * Ersättning
  "Eventuell kommentar"?: string; // Optional comment
  "Datum utbet"?: string; // Payout date (YYYY-MM-DD format)
  "Fortnox status"?: "pending" | "sent" | "error"; // Fortnox integration status
  created_at?: string;
  updated_at?: string;
}

export interface CompensationFormData extends Omit<CompensationRecord, "id" | "Total ersättning" | "created_at" | "updated_at" | "employee_id"> {
  "Total ersättning": number; // Always calculated in forms
  "employee_id"?: string; // Auto-populated from selected personnel
}

// For grouping by person
export interface PersonCompensation {
  personnelId: string;
  personnelName: string;
  totalCompensation: number;
  compensations: CompensationRecord[];
}

// For period selection
export interface CompensationPeriod {
  month: number;
  year: number;
  label: string; // e.g., "Oktober 2024"
}

// Compensation view modes
export type CompensationViewMode = "person" | "compensation";

// For Excel upload validation
export interface CompensationUploadData {
  validRecords: CompensationRecord[];
  invalidRecords: Array<{
    row: number;
    data: Partial<CompensationRecord>;
    errors: string[];
  }>;
  totalRows: number;
}

// Form props interfaces
export interface CompensationFormProps {
  isOpen: boolean;
  initialData?: Partial<CompensationRecord>;
  onSubmit: (data: CompensationFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Table props interfaces  
export interface CompensationTableProps {
  compensations: CompensationRecord[];
  onEdit: (compensation: CompensationRecord) => void;
  onDelete: (id: string) => void;
  onAddNew: (data?: Partial<CompensationRecord>) => void;
  loading?: boolean;
}

export interface PersonCompensationCardProps {
  personCompensation: PersonCompensation;
  period: CompensationPeriod;
  onEditCompensation: (compensation: CompensationRecord) => void;
  onDeleteCompensation: (id: string) => void;
  onAddCompensation: (personnelName: string) => void;
}