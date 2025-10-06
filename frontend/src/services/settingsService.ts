import type { Settings } from "../types/settings";

const API_BASE_URL = "http://localhost:3000/api";

export const settingsService = {
  async fetchSettings(organization: string): Promise<Settings> {
    const response = await fetch(`${API_BASE_URL}/org/${encodeURIComponent(organization)}/settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return response.json();
  },

  async updateSettings(organization: string, settings: Settings): Promise<Settings> {
    const response = await fetch(`${API_BASE_URL}/org/${encodeURIComponent(organization)}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error('Failed to update settings');
    }
    return response.json();
  },

  async updateSettingsSection(organization: string, section: keyof Settings, data: any): Promise<Settings> {
    const response = await fetch(`${API_BASE_URL}/org/${encodeURIComponent(organization)}/settings/${section}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ${section} settings`);
    }
    return response.json();
  },

  createDefaultSettings(organizationName: string): Settings {
    return {
      employerFees: {
        baseAmount: 29750,
        standardTax: 30.0,
        vacationPayEnabled: true,
        vacationPayRate: 12.0,
        gransForArbetsgivaravgift: 1000.0
      },
      organization: {
        name: organizationName,
        organizationNumber: "",
        contactPerson: "",
        contactEmail: "",
        positions: ["Domare", "Tränare", "Admin", "Kassör"]
      },
      integrations: {
        googleSheets: {
          url: "",
          autoSync: false
        },
        bank: {
          bank: "",
          account: ""
        },
        fortnox: {
          enabled: false,
          apiToken: ""
        }
      },
      ageBasedFees: [
        {
          id: "1",
          lowerBound: 0,
          upperBound: 18,
          feeRate: 10.21,
          description: "Reducerad arbetsgivaravgift för unga"
        },
        {
          id: "2", 
          lowerBound: 19,
          upperBound: 64,
          feeRate: 31.42,
          description: "Ordinarie arbetsgivaravgift"
        },
        {
          id: "3",
          lowerBound: 65,
          upperBound: null,
          feeRate: 10.21,
          description: "Reducerad arbetsgivaravgift för seniorer"
        }
      ],
      accounts: [
        {
          id: "1",
          accountNumber: "2610",
          accountName: "Löner",
          type: "Kostnad"
        },
        {
          id: "2",
          accountNumber: "2711",
          accountName: "Arbetsgivaravgifter",
          type: "Kostnad"
        },
        {
          id: "3",
          accountNumber: "2910", 
          accountName: "Semesterersättning",
          type: "Kostnad"
        }
      ],
      costCenters: [
        {
          id: "1",
          code: "100",
          name: "Administration",
          description: "Administrativa kostnader"
        },
        {
          id: "2",
          code: "200", 
          name: "Verksamhet",
          description: "Verksamhetskostnader"
        },
        {
          id: "3",
          code: "300",
          name: "Tävling",
          description: "Tävlingsverksamhet"
        }
      ],
      salaryTypes: [
        {
          id: "1",
          name: "Grundlön",
          account: "2610",
          costCenter: "200",
          category: "regular",
          vacationRate: 12
        },
        {
          id: "2",
          name: "Tävlingsersättning",
          account: "2610", 
          costCenter: "300",
          category: "sports",
          vacationRate: null
        },
        {
          id: "3",
          name: "Träningsersättning",
          account: "2610",
          costCenter: "300", 
          category: "sports",
          vacationRate: null
        }
      ]
    };
  }
};