import { Router } from "express";

const router = Router();

// Get settings for an organization
router.get("/org/:org/settings", async (req, res) => {
  try {
    const { org } = req.params;
    const supabase = req.app.locals.supabase;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Fetch settings from database
    const { data: settings, error } = await supabase
      .from("organization_settings")
      .select("*")
      .eq("organization", org)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching settings:", error);
      return res.status(500).json({ error: "Failed to fetch settings" });
    }

    // If no settings exist, return default settings
    if (!settings) {
      const defaultSettings = createDefaultSettings(org);
      return res.json(defaultSettings);
    }

    res.json(settings.settings_data);
  } catch (error) {
    console.error("Error in GET settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update settings for an organization
router.put("/org/:org/settings", async (req, res) => {
  try {
    const { org } = req.params;
    const settingsData = req.body;
    const supabase = req.app.locals.supabase;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Upsert settings (insert or update)
    const { data, error } = await supabase
      .from("organization_settings")
      .upsert(
        {
          organization: org,
          settings_data: settingsData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating settings:", error);
      return res.status(500).json({ error: "Failed to update settings" });
    }

    res.json(data.settings_data);
  } catch (error) {
    console.error("Error in PUT settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update specific settings section
router.patch("/org/:org/settings/:section", async (req, res) => {
  try {
    const { org, section } = req.params;
    const sectionData = req.body;
    const supabase = req.app.locals.supabase;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // First get current settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from("organization_settings")
      .select("settings_data")
      .eq("organization", org)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching current settings:", fetchError);
      return res
        .status(500)
        .json({ error: "Failed to fetch current settings" });
    }

    // Merge with existing settings or create new
    const existingData =
      currentSettings?.settings_data || createDefaultSettings(org);
    const updatedSettings = {
      ...existingData,
      [section]: sectionData,
    };

    // Update the settings
    const { data, error } = await supabase
      .from("organization_settings")
      .upsert(
        {
          organization: org,
          settings_data: updatedSettings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating settings section:", error);
      return res
        .status(500)
        .json({ error: "Failed to update settings section" });
    }

    res.json(data.settings_data);
  } catch (error) {
    console.error("Error in PATCH settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function createDefaultSettings(organizationName) {
  return {
    employerFees: {
      standardFee: 31.42,
      reducedFee: 10.21,
      pensionerFee: 10.21,
      baseAmount: 29750,
      standardTax: 30.0,
      vacationPayEnabled: true,
      vacationPayRate: 12.0,
    },
    organization: {
      name: organizationName,
      organizationNumber: "",
      contactPerson: "",
      contactEmail: "",
    },
    integrations: {
      googleSheets: {
        url: "",
        autoSync: false,
      },
      bank: {
        bank: "",
        account: "",
      },
      fortnox: {
        enabled: false,
        apiToken: "",
      },
    },
    ageBasedFees: [
      {
        id: "1",
        ageGroup: "Under 19 år",
        feeRate: 10.21,
        description: "Reducerad arbetsgivaravgift för unga",
      },
      {
        id: "2",
        ageGroup: "19-64 år",
        feeRate: 31.42,
        description: "Ordinarie arbetsgivaravgift",
      },
      {
        id: "3",
        ageGroup: "65+ år",
        feeRate: 10.21,
        description: "Reducerad arbetsgivaravgift för seniorer",
      },
    ],
    accounts: [
      {
        id: "1",
        accountNumber: "2610",
        accountName: "Löner",
        type: "Kostnad",
      },
      {
        id: "2",
        accountNumber: "2711",
        accountName: "Arbetsgivaravgifter",
        type: "Kostnad",
      },
      {
        id: "3",
        accountNumber: "2910",
        accountName: "Semesterersättning",
        type: "Kostnad",
      },
    ],
    costCenters: [
      {
        id: "1",
        code: "100",
        name: "Administration",
        description: "Administrativa kostnader",
      },
      {
        id: "2",
        code: "200",
        name: "Verksamhet",
        description: "Verksamhetskostnader",
      },
      {
        id: "3",
        code: "300",
        name: "Tävling",
        description: "Tävlingsverksamhet",
      },
    ],
    salaryTypes: [
      {
        id: "1",
        name: "Grundlön",
        account: "2610",
        costCenter: "200",
        category: "regular",
        vacationRate: 12,
      },
      {
        id: "2",
        name: "Tävlingsersättning",
        account: "2610",
        costCenter: "300",
        category: "sports",
        vacationRate: null,
      },
      {
        id: "3",
        name: "Träningsersättning",
        account: "2610",
        costCenter: "300",
        category: "sports",
        vacationRate: null,
      },
    ],
  };
}

export default router;
