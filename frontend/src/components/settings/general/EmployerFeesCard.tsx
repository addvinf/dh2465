import { useState, useEffect } from "react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Calculator, Save } from "lucide-react";
import { useSettings } from "../../../contexts/SettingsContext";
import { useToast } from "../../ui/use-toast";

export function EmployerFeesCard() {
  const { settings, updateEmployerFees } = useSettings();
  const { toast } = useToast();

  const [localEmployerFees, setLocalEmployerFees] = useState(
    settings.employerFees
  );

  // Update local state when settings change
  useEffect(() => {
    setLocalEmployerFees(settings.employerFees);
  }, [settings.employerFees]);

  const handleSaveEmployerFees = async () => {
    try {
      await updateEmployerFees(localEmployerFees);
      toast({
        description: "Arbetsgivaravgifter har sparats!",
        variant: "default",
      });
    } catch (error) {
      toast({
        description: "Kunde inte spara arbetsgivaravgifter",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Arbetsgivaravgifter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="base-amount">Halvt basbelopp 2025 (kr)</Label>
            <Input
              id="base-amount"
              type="number"
              value={localEmployerFees.baseAmount}
              onChange={(e) =>
                setLocalEmployerFees({
                  ...localEmployerFees,
                  baseAmount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="standard-tax">Standardskatt (%)</Label>
            <Input
              id="standard-tax"
              type="number"
              step="0.01"
              value={localEmployerFees.standardTax}
              onChange={(e) =>
                setLocalEmployerFees({
                  ...localEmployerFees,
                  standardTax: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vacation-pay-rate">Semesterersättning (%)</Label>
            <Input
              id="vacation-pay-rate"
              type="number"
              step="0.01"
              value={localEmployerFees.vacationPayRate}
              onChange={(e) =>
                setLocalEmployerFees({
                  ...localEmployerFees,
                  vacationPayRate: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="grans-arbetsgivaravgift">
              Gräns för arbetsgivaravgift (kr)
            </Label>
            <Input
              id="grans-arbetsgivaravgift"
              type="number"
              value={localEmployerFees.gransForArbetsgivaravgift}
              onChange={(e) =>
                setLocalEmployerFees({
                  ...localEmployerFees,
                  gransForArbetsgivaravgift: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minsta belopp för arbetsgivaravgifter på ej-idrottslöner
            </p>
          </div>
        </div>{" "}
        <div className="flex items-center space-x-2">
          <Switch
            id="vacation-pay"
            checked={localEmployerFees.vacationPayEnabled}
            onCheckedChange={(checked) =>
              setLocalEmployerFees({
                ...localEmployerFees,
                vacationPayEnabled: checked,
              })
            }
          />
          <Label htmlFor="vacation-pay">Automatisk semesterersättning</Label>
        </div>
        <Button
          className="bg-secondary text-primary-foreground"
          onClick={handleSaveEmployerFees}
        >
          <Save className="mr-2 h-4 w-4" />
          Spara ändringar
        </Button>
      </CardContent>
    </Card>
  );
}
