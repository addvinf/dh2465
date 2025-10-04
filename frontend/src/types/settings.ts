// Settings types and interfaces
export interface EmployerFees {
  baseAmount: number;
  standardTax: number;
  vacationPayEnabled: boolean;
  vacationPayRate: number;
  gransForArbetsgivaravgift: number; // New field for employer fee threshold
}

export interface AgeBasedFee {
  id: string;
  lowerBound: number;
  upperBound: number | null; // null for no upper limit (e.g., 65+)
  feeRate: number;
  description: string;
}

export interface Organization {
  name: string;
  organizationNumber: string;
  contactPerson: string;
  contactEmail: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  type: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface SalaryType {
  id: string;
  name: string;
  account: string;
  costCenter: string;
  category: 'sports' | 'regular';
  vacationRate: number | null;
}

export interface GoogleSheetsIntegration {
  url: string;
  autoSync: boolean;
}

export interface BankIntegration {
  bank: string;
  account: string;
}

export interface FortnoxIntegration {
  enabled: boolean;
  apiToken: string;
}

export interface Integrations {
  googleSheets: GoogleSheetsIntegration;
  bank: BankIntegration;
  fortnox: FortnoxIntegration;
}

export interface Settings {
  employerFees: EmployerFees;
  ageBasedFees: AgeBasedFee[];
  organization: Organization;
  accounts: Account[];
  costCenters: CostCenter[];
  salaryTypes: SalaryType[];
  integrations: Integrations;
}

export interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  updateEmployerFees: (fees: Partial<EmployerFees>) => Promise<void>;
  updateOrganization: (org: Partial<Organization>) => Promise<void>;
  updateIntegrations: (integrations: Partial<Integrations>) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addCostCenter: (costCenter: Omit<CostCenter, 'id'>) => Promise<void>;
  updateCostCenter: (id: string, costCenter: Partial<CostCenter>) => Promise<void>;
  deleteCostCenter: (id: string) => Promise<void>;
  addSalaryType: (salaryType: Omit<SalaryType, 'id'>) => Promise<void>;
  updateSalaryType: (id: string, salaryType: Partial<SalaryType>) => Promise<void>;
  deleteSalaryType: (id: string) => Promise<void>;
  addAgeBasedFee: (fee: Omit<AgeBasedFee, 'id'>) => Promise<void>;
  updateAgeBasedFee: (id: string, fee: Partial<AgeBasedFee>) => Promise<void>;
  deleteAgeBasedFee: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}