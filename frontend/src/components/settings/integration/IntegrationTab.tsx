import { useState, useEffect } from "react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Settings, Save, Upload } from "lucide-react";
import { useSettings } from "../../../contexts/SettingsContext";
import { useToast } from "../../../hooks/use-toast";

export function IntegrationTab() {
  const { settings, updateIntegrations } = useSettings();
  const { toast } = useToast();

  const [localIntegrations, setLocalIntegrations] = useState(
    settings.integrations
  );

  // Update local state when settings change
  useEffect(() => {
    setLocalIntegrations(settings.integrations);
  }, [settings.integrations]);

  const handleSaveIntegrations = async () => {
    try {
      await updateIntegrations(localIntegrations);
      toast({
        title: "Sparad",
        description: "Integrationsinställningar har sparats!",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara integrationsinställningar",
        variant: "destructive",
      });
    }
  };

  const showNotImplementedToast = (integrationName: string) => {
    toast({
      title: "Inte implementerat än",
      description: `${integrationName} är inte implementerat ännu. Denna funktion kommer i en framtida version.`,
      variant: "default",
    });
  };

  return (
    <>
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sheets-url">Google Sheets URL</Label>
            <Input
              id="sheets-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={localIntegrations.googleSheets.url}
              onChange={(e) =>
                setLocalIntegrations({
                  ...localIntegrations,
                  googleSheets: {
                    ...localIntegrations.googleSheets,
                    url: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-sync"
              checked={localIntegrations.googleSheets.autoSync}
              onCheckedChange={(checked) =>
                setLocalIntegrations({
                  ...localIntegrations,
                  googleSheets: {
                    ...localIntegrations.googleSheets,
                    autoSync: checked,
                  },
                })
              }
            />
            <Label htmlFor="auto-sync">
              Automatisk synkronisering varje månad
            </Label>
          </div>

          <div className="flex space-x-2">
            <Button
              className="bg-secondary text-primary-foreground"
              onClick={() =>
                showNotImplementedToast("Google Sheets synkronisering")
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              Synka nu
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                showNotImplementedToast("Google Sheets anslutningstest")
              }
            >
              Testa anslutning
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Bank Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bank">Bank</Label>
            <Input
              id="bank"
              value={localIntegrations.bank.bank}
              onChange={(e) =>
                setLocalIntegrations({
                  ...localIntegrations,
                  bank: {
                    ...localIntegrations.bank,
                    bank: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="account">Betalkonto</Label>
            <Input
              id="account"
              value={localIntegrations.bank.account}
              onChange={(e) =>
                setLocalIntegrations({
                  ...localIntegrations,
                  bank: {
                    ...localIntegrations.bank,
                    account: e.target.value,
                  },
                })
              }
            />
          </div>

          <Button
            variant="outline"
            onClick={() =>
              showNotImplementedToast("Bank filformat konfiguration")
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            Konfigurera filformat
          </Button>
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Fortnox Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="fortnox-enabled"
              checked={localIntegrations.fortnox.enabled}
              onCheckedChange={(checked) =>
                setLocalIntegrations({
                  ...localIntegrations,
                  fortnox: {
                    ...localIntegrations.fortnox,
                    enabled: checked,
                  },
                })
              }
            />
            <Label htmlFor="fortnox-enabled">
              Aktivera Fortnox-integration
            </Label>
          </div>

          <div>
            <Label htmlFor="fortnox-token">API Token</Label>
            <Input
              id="fortnox-token"
              type="password"
              placeholder="Ange ditt Fortnox API-token"
              value={localIntegrations.fortnox.apiToken}
              onChange={(e) =>
                setLocalIntegrations({
                  ...localIntegrations,
                  fortnox: {
                    ...localIntegrations.fortnox,
                    apiToken: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => showNotImplementedToast("Fortnox anslutningstest")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Testa anslutning
            </Button>
            <Button
              className="bg-secondary text-primary-foreground"
              onClick={handleSaveIntegrations}
            >
              <Save className="mr-2 h-4 w-4" />
              Spara inställningar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
