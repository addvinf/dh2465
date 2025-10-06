import { useState, useEffect } from "react";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Users, Save } from "lucide-react";
import { useSettings } from "../../../contexts/SettingsContext";
import { useToast } from "../../../hooks/use-toast";

export function PositionsCard() {
  const { settings, updateOrganization } = useSettings();
  const { toast } = useToast();

  const [positionsText, setPositionsText] = useState("");

  // Convert array of positions to comma-separated text
  useEffect(() => {
    if (settings.organization.positions) {
      setPositionsText(settings.organization.positions.join(", "));
    }
  }, [settings.organization.positions]);

  const handleSavePositions = async () => {
    try {
      // Convert text to array, trim whitespace, and filter empty values
      const positionsArray = positionsText
        .split(",")
        .map((pos) => pos.trim())
        .filter((pos) => pos.length > 0);

      await updateOrganization({ positions: positionsArray });

      toast({
        title: "Sparad",
        description: "Befattningar har sparats!",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara befattningar",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Befattningar
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ange alla befattningar som används i organisationen, separerade med
          kommatecken
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="positions-text">Befattningar</Label>
          <Input
            id="positions-text"
            value={positionsText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPositionsText(e.target.value)
            }
            placeholder="Domare, Tränare, Admin, Kassör"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separera befattningar med kommatecken
          </p>
        </div>

        <Button
          className="bg-secondary text-primary-foreground"
          onClick={handleSavePositions}
        >
          <Save className="mr-2 h-4 w-4" />
          Spara befattningar
        </Button>
      </CardContent>
    </Card>
  );
}
