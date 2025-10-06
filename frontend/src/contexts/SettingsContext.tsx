import { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  Settings,
  SettingsContextType,
  EmployerFees,
  Organization,
  Integrations,
  Account,
  CostCenter,
  SalaryType,
  AgeBasedFee,
} from "../types/settings";
import { settingsService } from "../services/settingsService";

// Default settings
const defaultSettings: Settings = {
  employerFees: {
    baseAmount: 29400,
    standardTax: 30,
    vacationPayEnabled: true,
    vacationPayRate: 12,
    gransForArbetsgivaravgift: 1000,
  },
  ageBasedFees: [
    {
      id: "1",
      lowerBound: 0,
      upperBound: 18,
      feeRate: 15.49,
      description: "Reducerad avgift för unga",
    },
    {
      id: "2",
      lowerBound: 19,
      upperBound: 64,
      feeRate: 31.42,
      description: "Ordinarie avgift",
    },
    {
      id: "3",
      lowerBound: 65,
      upperBound: null,
      feeRate: 10.21,
      description: "Pensionärsavgift",
    },
  ],
  organization: {
    name: "Halmstad BK",
    organizationNumber: "802411-1234",
    contactPerson: "Anna Larsson",
    contactEmail: "anna@halmstadbk.se",
    positions: ["Domare", "Tränare", "Admin", "Kassör"],
  },
  accounts: [
    {
      id: "1",
      accountNumber: "7110",
      accountName: "Löner ordinarie personal",
      type: "Lönekostnad",
    },
    {
      id: "2",
      accountNumber: "7120",
      accountName: "Tränarlöner",
      type: "Lönekostnad",
    },
    {
      id: "3",
      accountNumber: "7130",
      accountName: "Domararvoden",
      type: "Lönekostnad",
    },
  ],
  costCenters: [
    {
      id: "1",
      code: "1",
      name: "Administration",
      description: "Kansli och styrelsekostnader",
    },
    {
      id: "2",
      code: "5",
      name: "Träning",
      description: "Tränarkostnader och träningsverksamhet",
    },
    {
      id: "3",
      code: "6",
      name: "Matcher",
      description: "Domare och matchkostnader",
    },
    { id: "4", code: "7", name: "Café", description: "Serveringsverksamhet" },
  ],
  salaryTypes: [
    {
      id: "1",
      name: "Lön Tränare",
      account: "7120",
      costCenter: "5 - Träning",
      category: "sports",
      vacationRate: 12,
    },
    {
      id: "2",
      name: "Domararvoden",
      account: "7130",
      costCenter: "6 - Matcher",
      category: "sports",
      vacationRate: null,
    },
    {
      id: "3",
      name: "Administrativ personal",
      account: "7110",
      costCenter: "1 - Administration",
      category: "regular",
      vacationRate: 12,
    },
  ],
  integrations: {
    googleSheets: {
      url: "https://docs.google.com/spreadsheets/d/1abc...xyz/edit",
      autoSync: true,
    },
    bank: {
      bank: "SEB",
      account: "5555 12 34567",
    },
    fortnox: {
      enabled: true,
      apiToken: "",
    },
  },
};

// Settings reducer
type SettingsAction =
  | { type: "SET_SETTINGS"; payload: Settings }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_EMPLOYER_FEES"; payload: Partial<EmployerFees> }
  | { type: "UPDATE_ORGANIZATION"; payload: Partial<Organization> }
  | { type: "UPDATE_INTEGRATIONS"; payload: Partial<Integrations> }
  | { type: "ADD_ACCOUNT"; payload: Account }
  | {
      type: "UPDATE_ACCOUNT";
      payload: { id: string; account: Partial<Account> };
    }
  | { type: "DELETE_ACCOUNT"; payload: string }
  | { type: "ADD_COST_CENTER"; payload: CostCenter }
  | {
      type: "UPDATE_COST_CENTER";
      payload: { id: string; costCenter: Partial<CostCenter> };
    }
  | { type: "DELETE_COST_CENTER"; payload: string }
  | { type: "ADD_SALARY_TYPE"; payload: SalaryType }
  | {
      type: "UPDATE_SALARY_TYPE";
      payload: { id: string; salaryType: Partial<SalaryType> };
    }
  | { type: "DELETE_SALARY_TYPE"; payload: string }
  | { type: "ADD_AGE_BASED_FEE"; payload: AgeBasedFee }
  | {
      type: "UPDATE_AGE_BASED_FEE";
      payload: { id: string; fee: Partial<AgeBasedFee> };
    }
  | { type: "DELETE_AGE_BASED_FEE"; payload: string };

interface SettingsState {
  settings: Settings;
  loading: boolean;
  error: string | null;
}

function settingsReducer(
  state: SettingsState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    case "SET_SETTINGS":
      return { ...state, settings: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "UPDATE_EMPLOYER_FEES":
      return {
        ...state,
        settings: {
          ...state.settings,
          employerFees: { ...state.settings.employerFees, ...action.payload },
        },
      };
    case "UPDATE_ORGANIZATION":
      return {
        ...state,
        settings: {
          ...state.settings,
          organization: { ...state.settings.organization, ...action.payload },
        },
      };
    case "UPDATE_INTEGRATIONS":
      return {
        ...state,
        settings: {
          ...state.settings,
          integrations: { ...state.settings.integrations, ...action.payload },
        },
      };
    case "ADD_ACCOUNT":
      return {
        ...state,
        settings: {
          ...state.settings,
          accounts: [...state.settings.accounts, action.payload],
        },
      };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        settings: {
          ...state.settings,
          accounts: state.settings.accounts.map((account) =>
            account.id === action.payload.id
              ? { ...account, ...action.payload.account }
              : account
          ),
        },
      };
    case "DELETE_ACCOUNT":
      return {
        ...state,
        settings: {
          ...state.settings,
          accounts: state.settings.accounts.filter(
            (account) => account.id !== action.payload
          ),
        },
      };
    case "ADD_COST_CENTER":
      return {
        ...state,
        settings: {
          ...state.settings,
          costCenters: [...state.settings.costCenters, action.payload],
        },
      };
    case "UPDATE_COST_CENTER":
      return {
        ...state,
        settings: {
          ...state.settings,
          costCenters: state.settings.costCenters.map((center) =>
            center.id === action.payload.id
              ? { ...center, ...action.payload.costCenter }
              : center
          ),
        },
      };
    case "DELETE_COST_CENTER":
      return {
        ...state,
        settings: {
          ...state.settings,
          costCenters: state.settings.costCenters.filter(
            (center) => center.id !== action.payload
          ),
        },
      };
    case "ADD_SALARY_TYPE":
      return {
        ...state,
        settings: {
          ...state.settings,
          salaryTypes: [...state.settings.salaryTypes, action.payload],
        },
      };
    case "UPDATE_SALARY_TYPE":
      return {
        ...state,
        settings: {
          ...state.settings,
          salaryTypes: state.settings.salaryTypes.map((type) =>
            type.id === action.payload.id
              ? { ...type, ...action.payload.salaryType }
              : type
          ),
        },
      };
    case "DELETE_SALARY_TYPE":
      return {
        ...state,
        settings: {
          ...state.settings,
          salaryTypes: state.settings.salaryTypes.filter(
            (type) => type.id !== action.payload
          ),
        },
      };
    case "ADD_AGE_BASED_FEE":
      return {
        ...state,
        settings: {
          ...state.settings,
          ageBasedFees: [...state.settings.ageBasedFees, action.payload],
        },
      };
    case "UPDATE_AGE_BASED_FEE":
      return {
        ...state,
        settings: {
          ...state.settings,
          ageBasedFees: state.settings.ageBasedFees.map((fee) =>
            fee.id === action.payload.id
              ? { ...fee, ...action.payload.fee }
              : fee
          ),
        },
      };
    case "DELETE_AGE_BASED_FEE":
      return {
        ...state,
        settings: {
          ...state.settings,
          ageBasedFees: state.settings.ageBasedFees.filter(
            (fee) => fee.id !== action.payload
          ),
        },
      };
    default:
      return state;
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
  organizationId?: string;
}

export function SettingsProvider({
  children,
  organizationId = "test_förening",
}: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, {
    settings: defaultSettings,
    loading: false,
    error: null,
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const data = await settingsService.fetchSettings(organizationId);
        dispatch({ type: "SET_SETTINGS", payload: data });
      } catch (error) {
        console.error("Failed to load settings:", error);
        // Load default settings if API fails
        const defaultSettings =
          settingsService.createDefaultSettings("Test Förening");
        dispatch({ type: "SET_SETTINGS", payload: defaultSettings });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadSettings();
  }, [organizationId]);

  const saveSettings = async (newSettings: Settings) => {
    try {
      await settingsService.updateSettings(organizationId, newSettings);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: "Kunde inte spara inställningar",
      });
      throw error;
    }
  };

  const updateSettingsAction = async (updates: Partial<Settings>) => {
    const newSettings = { ...state.settings, ...updates };
    dispatch({ type: "SET_SETTINGS", payload: newSettings });
    await saveSettings(newSettings);
  };

  const updateEmployerFees = async (fees: Partial<EmployerFees>) => {
    const newSettings = {
      ...state.settings,
      employerFees: { ...state.settings.employerFees, ...fees },
    };
    dispatch({ type: "UPDATE_EMPLOYER_FEES", payload: fees });
    await saveSettings(newSettings);
  };

  const updateOrganization = async (org: Partial<Organization>) => {
    const newSettings = {
      ...state.settings,
      organization: { ...state.settings.organization, ...org },
    };
    dispatch({ type: "UPDATE_ORGANIZATION", payload: org });
    await saveSettings(newSettings);
  };

  const updateIntegrations = async (integrations: Partial<Integrations>) => {
    const newSettings = {
      ...state.settings,
      integrations: { ...state.settings.integrations, ...integrations },
    };
    dispatch({ type: "UPDATE_INTEGRATIONS", payload: integrations });
    await saveSettings(newSettings);
  };

  const addAccount = async (account: Omit<Account, "id">) => {
    const newAccount = { ...account, id: Date.now().toString() };
    const newSettings = {
      ...state.settings,
      accounts: [...state.settings.accounts, newAccount],
    };
    dispatch({ type: "ADD_ACCOUNT", payload: newAccount });
    await saveSettings(newSettings);
  };

  const updateAccount = async (id: string, account: Partial<Account>) => {
    const newSettings = {
      ...state.settings,
      accounts: state.settings.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...account } : acc
      ),
    };
    dispatch({ type: "UPDATE_ACCOUNT", payload: { id, account } });
    await saveSettings(newSettings);
  };

  const deleteAccount = async (id: string) => {
    const newSettings = {
      ...state.settings,
      accounts: state.settings.accounts.filter((acc) => acc.id !== id),
    };
    dispatch({ type: "DELETE_ACCOUNT", payload: id });
    await saveSettings(newSettings);
  };

  const addCostCenter = async (costCenter: Omit<CostCenter, "id">) => {
    const newCostCenter = { ...costCenter, id: Date.now().toString() };
    const newSettings = {
      ...state.settings,
      costCenters: [...state.settings.costCenters, newCostCenter],
    };
    dispatch({ type: "ADD_COST_CENTER", payload: newCostCenter });
    await saveSettings(newSettings);
  };

  const updateCostCenter = async (
    id: string,
    costCenter: Partial<CostCenter>
  ) => {
    const newSettings = {
      ...state.settings,
      costCenters: state.settings.costCenters.map((center) =>
        center.id === id ? { ...center, ...costCenter } : center
      ),
    };
    dispatch({ type: "UPDATE_COST_CENTER", payload: { id, costCenter } });
    await saveSettings(newSettings);
  };

  const deleteCostCenter = async (id: string) => {
    const newSettings = {
      ...state.settings,
      costCenters: state.settings.costCenters.filter(
        (center) => center.id !== id
      ),
    };
    dispatch({ type: "DELETE_COST_CENTER", payload: id });
    await saveSettings(newSettings);
  };

  const addSalaryType = async (salaryType: Omit<SalaryType, "id">) => {
    const newSalaryType = { ...salaryType, id: Date.now().toString() };
    const newSettings = {
      ...state.settings,
      salaryTypes: [...state.settings.salaryTypes, newSalaryType],
    };
    dispatch({ type: "ADD_SALARY_TYPE", payload: newSalaryType });
    await saveSettings(newSettings);
  };

  const updateSalaryType = async (
    id: string,
    salaryType: Partial<SalaryType>
  ) => {
    const newSettings = {
      ...state.settings,
      salaryTypes: state.settings.salaryTypes.map((type) =>
        type.id === id ? { ...type, ...salaryType } : type
      ),
    };
    dispatch({ type: "UPDATE_SALARY_TYPE", payload: { id, salaryType } });
    await saveSettings(newSettings);
  };

  const deleteSalaryType = async (id: string) => {
    const newSettings = {
      ...state.settings,
      salaryTypes: state.settings.salaryTypes.filter((type) => type.id !== id),
    };
    dispatch({ type: "DELETE_SALARY_TYPE", payload: id });
    await saveSettings(newSettings);
  };

  const addAgeBasedFee = async (fee: Omit<AgeBasedFee, "id">) => {
    const newFee = { ...fee, id: Date.now().toString() };
    const newSettings = {
      ...state.settings,
      ageBasedFees: [...state.settings.ageBasedFees, newFee],
    };
    dispatch({ type: "ADD_AGE_BASED_FEE", payload: newFee });
    await saveSettings(newSettings);
  };

  const updateAgeBasedFee = async (id: string, fee: Partial<AgeBasedFee>) => {
    const newSettings = {
      ...state.settings,
      ageBasedFees: state.settings.ageBasedFees.map((existingFee) =>
        existingFee.id === id ? { ...existingFee, ...fee } : existingFee
      ),
    };
    dispatch({ type: "UPDATE_AGE_BASED_FEE", payload: { id, fee } });
    await saveSettings(newSettings);
  };

  const deleteAgeBasedFee = async (id: string) => {
    const newSettings = {
      ...state.settings,
      ageBasedFees: state.settings.ageBasedFees.filter((fee) => fee.id !== id),
    };
    dispatch({ type: "DELETE_AGE_BASED_FEE", payload: id });
    await saveSettings(newSettings);
  };

  const value: SettingsContextType = {
    settings: state.settings,
    updateSettings: updateSettingsAction,
    updateEmployerFees,
    updateOrganization,
    updateIntegrations,
    addAccount,
    updateAccount,
    deleteAccount,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    addSalaryType,
    updateSalaryType,
    deleteSalaryType,
    addAgeBasedFee,
    updateAgeBasedFee,
    deleteAgeBasedFee,
    loading: state.loading,
    error: state.error,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
