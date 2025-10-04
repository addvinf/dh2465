import { useState, useEffect } from "react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Building2, Save } from "lucide-react";
import { useSettings } from "../../../contexts/SettingsContext";
import { useToast } from "../../../hooks/use-toast";

export function OrganizationInfoCard() {
  const { settings, updateOrganization } = useSettings();
  const { toast } = useToast();

  const [localOrganization, setLocalOrganization] = useState(
    settings.organization
  );

  // Update local state when settings change
  useEffect(() => {
    setLocalOrganization(settings.organization);
  }, [settings.organization]);

  const handleSaveOrganization = async () => {
    try {
      await updateOrganization(localOrganization);
      toast({
        title: "Sparad",
        description: "Organisationsinformation har sparats!",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara organisationsinformation",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center">
          <Building2 className="mr-2 h-5 w-5" />
          Organisationsinformation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="org-name">Föreningsnamn</Label>
            <Input
              id="org-name"
              value={localOrganization.name}
              onChange={(e) =>
                setLocalOrganization({
                  ...localOrganization,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="org-number">Organisationsnummer</Label>
            <Input
              id="org-number"
              value={localOrganization.organizationNumber}
              onChange={(e) =>
                setLocalOrganization({
                  ...localOrganization,
                  organizationNumber: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact-person">Kontaktperson</Label>
            <Input
              id="contact-person"
              value={localOrganization.contactPerson}
              onChange={(e) =>
                setLocalOrganization({
                  ...localOrganization,
                  contactPerson: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="contact-email">Kontakt e-post</Label>
            <Input
              id="contact-email"
              type="email"
              value={localOrganization.contactEmail}
              onChange={(e) =>
                setLocalOrganization({
                  ...localOrganization,
                  contactEmail: e.target.value,
                })
              }
            />
          </div>
        </div>

        <Button
          className="bg-secondary text-primary-foreground"
          onClick={handleSaveOrganization}
        >
          <Save className="mr-2 h-4 w-4" />
          Spara ändringar
        </Button>
      </CardContent>
    </Card>
  );
}
