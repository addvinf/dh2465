import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Building2, Plus, Edit3, Trash2, Save } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import { useToast } from "../ui/use-toast";

export function OrganizationTab() {
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
        description: "Organisationsinformation har sparats!",
        variant: "default",
      });
    } catch (error) {
      toast({
        description: "Kunde inte spara organisationsinformation",
        variant: "destructive",
      });
    }
  };

  return (
    <>
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

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-foreground">
              Bokföringskonton
            </CardTitle>
            <Button size="sm" className="bg-secondary text-primary-foreground">
              <Plus className="mr-2 h-3 w-3" />
              Lägg till konto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kontonummer</TableHead>
                <TableHead>Kontonamn</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>{account.accountName}</TableCell>
                  <TableCell>{account.type}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-foreground">
              Kostnadsställen
            </CardTitle>
            <Button size="sm" className="bg-secondary text-primary-foreground">
              <Plus className="mr-2 h-3 w-3" />
              Lägg till kostnadsställe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.costCenters.map((center) => (
              <div
                key={center.id}
                className="p-3 border border-border rounded-lg"
              >
                <p className="font-medium">
                  {center.code} - {center.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {center.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
