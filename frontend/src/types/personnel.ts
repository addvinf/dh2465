// Personnel data types and interfaces

export interface PersonnelRecord {
  id?: string;
  created_at?: string;
  "Upplagd av": string;
  "Personnummer": string;
  "Förnamn": string;
  "Efternamn": string;
  "Clearingnr": string;
  "Bankkonto": string;
  "Adress": string;
  "Postnr": string;
  "Postort": string;
  "E-post": string;
  "Kostnadsställe": string;
  "Ändringsdag": string;
  "Månad": string;
  "Timme": string;
  "Heldag": string;
  "Annan": string;
  "Kommentar": string;
  "added_to_fortnox": boolean;
  "fortnox_employee_id": string;
}

export interface PersonnelColumn {
  key: keyof PersonnelRecord;
  label: string;
  visible: boolean;
  sortable?: boolean;
  searchable?: boolean;
  type?: 'text' | 'email' | 'number' | 'date';
}

// Define which columns to display in the table
export const PERSONNEL_COLUMNS: PersonnelColumn[] = [
  { key: "Förnamn", label: "Förnamn", visible: true, sortable: true, searchable: true },
  { key: "Efternamn", label: "Efternamn", visible: true, sortable: true, searchable: true },
  { key: "Personnummer", label: "Personnummer", visible: true, sortable: true },
  { key: "E-post", label: "E-post", visible: true, sortable: true, searchable: true, type: 'email' },
  { key: "Kostnadsställe", label: "Kostnadsställe", visible: true, sortable: true, searchable: true },
  { key: "Adress", label: "Adress", visible: true },
  { key: "Postnr", label: "Postnr", visible: true },
  { key: "Postort", label: "Postort", visible: true },
  { key: "Kommentar", label: "Kommentar", visible: true },
];

// Columns for form input (excluding system fields)
export const FORM_COLUMNS: PersonnelColumn[] = [
  { key: "Förnamn", label: "Förnamn", visible: true, type: 'text' },
  { key: "Efternamn", label: "Efternamn", visible: true, type: 'text' },
  { key: "Personnummer", label: "Personnummer", visible: true, type: 'text' },
  { key: "E-post", label: "E-post", visible: true, type: 'email' },
  { key: "Clearingnr", label: "Clearingnummer", visible: true, type: 'text' },
  { key: "Bankkonto", label: "Bankkonto", visible: true, type: 'text' },
  { key: "Adress", label: "Adress", visible: true, type: 'text' },
  { key: "Postnr", label: "Postnummer", visible: true, type: 'text' },
  { key: "Postort", label: "Postort", visible: true, type: 'text' },
  { key: "Kostnadsställe", label: "Kostnadsställe", visible: true, type: 'text' },
  { key: "Kommentar", label: "Kommentar", visible: true, type: 'text' },
];

export interface PersonnelTableProps {
  data: PersonnelRecord[];
  onEdit?: (record: PersonnelRecord) => void;
  onDelete?: (record: PersonnelRecord) => void;
  loading?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export interface PersonnelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PersonnelRecord>) => void;
  initialData?: Partial<PersonnelRecord>;
  loading?: boolean;
}