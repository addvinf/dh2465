import { useState } from "react";
import {
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/Button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type {
  CompensationTableProps,
  CompensationRecord,
} from "../../types/compensation";
import { useSettings } from "../../contexts/SettingsContext";
import { fetchPersonnel } from "../../services/personnelService";
import { useEffect } from "react";
import type { PersonnelRecord } from "../../types/personnel";

interface AddCompensationRowProps {
  onSave: (data: Partial<CompensationRecord>) => void;
  onCancel: () => void;
}

function AddCompensationRow({ onSave, onCancel }: AddCompensationRowProps) {
  const { settings } = useSettings();
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [formData, setFormData] = useState<Partial<CompensationRecord>>({
    "Upplagd av": settings.organization?.contactPerson || "",
    "Avser Mån/år": "",
    Ledare: "",
    Kostnadsställe: "",
    Aktivitetstyp: "",
    Antal: 1,
    Ersättning: 0,
    "Eventuell kommentar": "",
    "Datum utbet": "",
  });

  useEffect(() => {
    const loadPersonnel = async () => {
      try {
        const result = await fetchPersonnel("test_förening");
        setPersonnel(result.data);
      } catch (error) {
        console.error("Failed to load personnel:", error);
      }
    };
    loadPersonnel();
  }, []);

  const handleSave = () => {
    if (
      !formData.Ledare ||
      !formData["Avser Mån/år"] ||
      !formData.Kostnadsställe ||
      !formData.Aktivitetstyp
    ) {
      alert("Vänligen fyll i alla obligatoriska fält");
      return;
    }

    const totalCompensation =
      (formData.Antal || 0) * (formData.Ersättning || 0);
    onSave({
      ...formData,
      "Total ersättning": totalCompensation,
      "Fortnox status": "pending",
    });
  };

  const formatPersonnelName = (person: PersonnelRecord) =>
    `${person.Förnamn || ""} ${person.Efternamn || ""}`.trim();

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = -6; i <= 6; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      );
      const monthYear = date.toLocaleDateString("sv-SE", {
        month: "long",
        year: "numeric",
      });
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      options.push({ label: monthYear, value });
    }
    return options;
  };

  return (
    <TableRow className="bg-muted/20 border-2 border-dashed border-border">
      <TableCell>
        <Input
          value={formData["Upplagd av"] || ""}
          onChange={(e) =>
            setFormData({ ...formData, "Upplagd av": e.target.value })
          }
          placeholder="Upplagd av"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Select
          value={formData["Avser Mån/år"]}
          onValueChange={(value) =>
            setFormData({ ...formData, "Avser Mån/år": value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Välj månad" />
          </SelectTrigger>
          <SelectContent>
            {generateMonthOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={formData.Ledare}
          onValueChange={(value) => setFormData({ ...formData, Ledare: value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Välj person" />
          </SelectTrigger>
          <SelectContent>
            {personnel
              .filter((person) => formatPersonnelName(person).trim() !== "")
              .map((person) => (
                <SelectItem key={person.id} value={formatPersonnelName(person)}>
                  {formatPersonnelName(person)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={formData.Kostnadsställe}
          onValueChange={(value) =>
            setFormData({ ...formData, Kostnadsställe: value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Kostnadsställe" />
          </SelectTrigger>
          <SelectContent>
            {settings.costCenters
              .filter((cc) => cc.name && cc.name.trim() !== "")
              .map((cc) => (
                <SelectItem key={cc.id} value={cc.name}>
                  {cc.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={formData.Aktivitetstyp || ""}
          onChange={(e) =>
            setFormData({ ...formData, Aktivitetstyp: e.target.value })
          }
          placeholder="Aktivitetstyp"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={formData.Antal || ""}
          onChange={(e) =>
            setFormData({ ...formData, Antal: Number(e.target.value) })
          }
          placeholder="Antal"
          className="h-8"
          min="0"
          step="1"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={formData.Ersättning || ""}
          onChange={(e) =>
            setFormData({ ...formData, Ersättning: Number(e.target.value) })
          }
          placeholder="Ersättning"
          className="h-8"
          min="0"
          step="0.01"
        />
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">
          {((formData.Antal || 0) * (formData.Ersättning || 0)).toLocaleString(
            "sv-SE",
            {
              style: "currency",
              currency: "SEK",
            }
          )}
        </span>
      </TableCell>
      <TableCell>
        <Input
          type="date"
          value={formData["Datum utbet"] || ""}
          onChange={(e) =>
            setFormData({ ...formData, "Datum utbet": e.target.value })
          }
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Ny
        </Badge>
      </TableCell>
      <TableCell>
        <Input
          value={formData["Eventuell kommentar"] || ""}
          onChange={(e) =>
            setFormData({ ...formData, "Eventuell kommentar": e.target.value })
          }
          placeholder="Kommentar..."
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            className="h-7 text-xs"
          >
            Spara
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-7 text-xs"
          >
            Avbryt
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function CompensationTable({
  compensations,
  onEdit,
  onDelete,
  onAddNew,
  loading = false,
}: CompensationTableProps) {
  const [showAddRow, setShowAddRow] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const getFortnoxStatusBadge = (
    status?: CompensationRecord["Fortnox status"]
  ) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="default" className="text-xs bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Skickad
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Fel
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Väntande
          </Badge>
        );
    }
  };

  const handleAddNew = (_data: Partial<CompensationRecord>) => {
    onAddNew();
    // The parent component should handle the actual creation
    setShowAddRow(false);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Laddar ersättningar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Upplagd av</TableHead>
              <TableHead>Avser Mån/år</TableHead>
              <TableHead>Ledare</TableHead>
              <TableHead>Kostnadsställe</TableHead>
              <TableHead>Aktivitetstyp</TableHead>
              <TableHead>Antal</TableHead>
              <TableHead>Ersättning</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Utbetalningsdatum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kommentar</TableHead>
              <TableHead>Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compensations.map((compensation) => (
              <TableRow key={compensation.id}>
                <TableCell className="text-sm">
                  {compensation["Upplagd av"]}
                </TableCell>
                <TableCell className="text-sm">
                  {compensation["Avser Mån/år"]}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {compensation.Ledare}
                </TableCell>
                <TableCell className="text-sm">
                  {compensation.Kostnadsställe}
                </TableCell>
                <TableCell className="text-sm">
                  {compensation.Aktivitetstyp}
                </TableCell>
                <TableCell className="text-sm">{compensation.Antal}</TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(compensation.Ersättning)}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatCurrency(compensation["Total ersättning"] || 0)}
                </TableCell>
                <TableCell className="text-sm">
                  {compensation["Datum utbet"]
                    ? new Date(compensation["Datum utbet"]).toLocaleDateString(
                        "sv-SE"
                      )
                    : "—"}
                </TableCell>
                <TableCell>
                  {getFortnoxStatusBadge(compensation["Fortnox status"])}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">
                  {compensation["Eventuell kommentar"] || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(compensation)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(compensation.id!)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {showAddRow && (
              <AddCompensationRow
                onSave={handleAddNew}
                onCancel={() => setShowAddRow(false)}
              />
            )}

            {!showAddRow && (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddRow(true)}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Lägg till ny ersättning</span>
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {compensations.length === 0 && !showAddRow && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">Inga ersättningar registrerade</p>
          <Button
            variant="outline"
            onClick={() => setShowAddRow(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Lägg till första ersättning</span>
          </Button>
        </div>
      )}
    </div>
  );
}
