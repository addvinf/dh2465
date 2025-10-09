import { useState } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/Button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useSettings } from "../../contexts/SettingsContext";
import { SearchablePersonnelSelect } from "./Features/SearchablePersonnelSelect";
import { StatusDot } from "./Features/StatusDot";
import type { CompensationRecord } from "../../types/compensation";

interface SimpleCompensationTableProps {
  compensations: CompensationRecord[];
  onAdd: (compensation: Omit<CompensationRecord, "id">) => Promise<void>;
  onEdit: (
    id: string,
    compensation: Partial<CompensationRecord>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

interface CompensationFormData {
  "Upplagd av": string;
  "Avser Mån/år": string;
  Ledare: string;
  Kostnadsställe: string;
  Aktivitetstyp: string;
  Antal: number;
  Ersättning: number;
  "Datum utbet": string;
  "Eventuell kommentar": string;
}

export function SimpleCompensationTable({
  compensations,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
}: SimpleCompensationTableProps) {
  const { settings } = useSettings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CompensationFormData>({
    "Upplagd av": settings.organization?.contactPerson || "",
    "Avser Mån/år": "",
    Ledare: "",
    Kostnadsställe: "",
    Aktivitetstyp: "",
    Antal: 0,
    Ersättning: 0,
    "Datum utbet": "",
    "Eventuell kommentar": "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const calculateTotal = (antal: number, ersattning: number) => {
    return antal * ersattning;
  };

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

  const resetForm = () => {
    setFormData({
      "Upplagd av": settings.organization?.contactPerson || "",
      "Avser Mån/år": "",
      Ledare: "",
      Kostnadsställe: "",
      Aktivitetstyp: "",
      Antal: 0,
      Ersättning: 0,
      "Datum utbet": "",
      "Eventuell kommentar": "",
    });
  };

  const validateForm = (data: CompensationFormData) => {
    if (!data.Ledare || !data["Avser Mån/år"] || !data.Kostnadsställe) {
      alert(
        "Vänligen fyll i alla obligatoriska fält: Ledare, Månad/år och Kostnadsställe"
      );
      return false;
    }
    if (data.Antal <= 0 || data.Ersättning <= 0) {
      alert("Antal och Ersättning måste vara större än 0");
      return false;
    }
    if (data.Ledare.trim() === "") {
      alert("Vänligen välj en giltig ledare från listan");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm(formData)) return;

    const totalCompensation = calculateTotal(
      formData.Antal,
      formData.Ersättning
    );

    try {
      await onAdd({
        ...formData,
        "Total ersättning": totalCompensation,
        "Fortnox status": "pending",
      });
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add compensation:", error);
      alert("Kunde inte lägga till ersättning");
    }
  };

  const handleEdit = async (compensation: CompensationRecord) => {
    if (!validateForm(formData)) return;

    const totalCompensation = calculateTotal(
      formData.Antal,
      formData.Ersättning
    );

    try {
      await onEdit(compensation.id!, {
        ...formData,
        "Total ersättning": totalCompensation,
      });
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error("Failed to edit compensation:", error);
      alert("Kunde inte uppdatera ersättning");
    }
  };

  const startEdit = (compensation: CompensationRecord) => {
    setFormData({
      "Upplagd av": compensation["Upplagd av"] || "",
      "Avser Mån/år": compensation["Avser Mån/år"] || "",
      Ledare: compensation.Ledare || "",
      Kostnadsställe: compensation.Kostnadsställe || "",
      Aktivitetstyp: compensation.Aktivitetstyp || "",
      Antal: compensation.Antal || 0,
      Ersättning: compensation.Ersättning || 0,
      "Datum utbet": compensation["Datum utbet"] || "",
      "Eventuell kommentar": compensation["Eventuell kommentar"] || "",
    });
    setEditingId(compensation.id!);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Är du säker på att du vill ta bort denna ersättning?")) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error("Failed to delete compensation:", error);
        alert("Kunde inte ta bort ersättning");
      }
    }
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="whitespace-nowrap">Upplagd av</TableHead>
              <TableHead className="whitespace-nowrap">Månad/år</TableHead>
              <TableHead className="whitespace-nowrap">Ledare</TableHead>
              <TableHead className="whitespace-nowrap">
                Kostnadsställe
              </TableHead>
              <TableHead className="whitespace-nowrap">Aktivitetstyp</TableHead>
              <TableHead className="whitespace-nowrap">Antal</TableHead>
              <TableHead className="whitespace-nowrap">Ersättning</TableHead>
              <TableHead className="whitespace-nowrap">Total</TableHead>
              <TableHead className="whitespace-nowrap">Datum utbet</TableHead>
              <TableHead className="whitespace-nowrap">Kommentar</TableHead>
              <TableHead className="w-20 sticky right-0">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Existing Compensations */}
            {compensations
              .slice()
              .sort((a, b) => {
                const dateA = a["Avser Mån/år"] || "";
                const dateB = b["Avser Mån/år"] || "";

                if (dateA !== dateB) {
                  return dateB.localeCompare(dateA);
                }

                const personA = a.Ledare || "";
                const personB = b.Ledare || "";
                return personA.localeCompare(personB, "sv-SE");
              })
              .map((compensation) => {
                const isEditing = editingId === compensation.id;

                if (isEditing) {
                  return (
                    <TableRow
                      key={compensation.id}
                      className="bg-muted/20 h-10"
                    >
                      <TableCell className="p-1 w-8">
                        <StatusDot status="pending" />
                      </TableCell>
                      <TableCell className="py-2 p-1 text-xs">
                        <Input
                          value={formData["Upplagd av"]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              "Upplagd av": e.target.value,
                            })
                          }
                          className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                        />
                      </TableCell>
                      <TableCell className="py-2 p-1">
                        <Select
                          value={formData["Avser Mån/år"]}
                          onValueChange={(value) =>
                            setFormData({ ...formData, "Avser Mån/år": value })
                          }
                        >
                          <SelectTrigger className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {generateMonthOptions().map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-2 p-1">
                        <SearchablePersonnelSelect
                          value={formData.Ledare}
                          onValueChange={(value) =>
                            setFormData({ ...formData, Ledare: value })
                          }
                          placeholder="Välj ledare"
                          className="[&>div>button]:border-0 [&>div>button]:bg-transparent [&>div>button]:rounded-none [&>div>button]:shadow-none [&>div>button]:focus:bg-background [&>div>button]:focus:shadow-sm [&>div>button]:h-auto [&>div>button]:text-xs"
                        />
                      </TableCell>
                      <TableCell className="py-2 p-1">
                        <Select
                          value={formData.Kostnadsställe}
                          onValueChange={(value) =>
                            setFormData({ ...formData, Kostnadsställe: value })
                          }
                        >
                          <SelectTrigger className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs">
                            <SelectValue />
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
                      <TableCell className="py-2 p-1">
                        <Input
                          value={formData.Aktivitetstyp}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              Aktivitetstyp: e.target.value,
                            })
                          }
                          className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                        />
                      </TableCell>
                      <TableCell className="py-2 p-1 text-xs">
                        <Input
                          type="number"
                          value={formData.Antal || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              Antal:
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                            })
                          }
                          min="0"
                          step="1"
                          className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </TableCell>
                      <TableCell className="py-2 p-1 text-xs">
                        <Input
                          type="number"
                          value={formData.Ersättning || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              Ersättning:
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                            })
                          }
                          min="0"
                          step="0.01"
                          className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </TableCell>
                      <TableCell className="py-2 p-1">
                        <span className="font-medium text-xs">
                          {formatCurrency(
                            calculateTotal(formData.Antal, formData.Ersättning)
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 p-1">
                        <Input
                          type="date"
                          value={formData["Datum utbet"]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              "Datum utbet": e.target.value,
                            })
                          }
                          className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                        />
                      </TableCell>
                      <TableCell className="py-2 p-1">
                        <Input
                          value={formData["Eventuell kommentar"]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              "Eventuell kommentar": e.target.value,
                            })
                          }
                          className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                        />
                      </TableCell>
                      <TableCell className="py-2 sticky right-0">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(compensation)}
                            className="h-7 w-7 p-0"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow
                    key={compensation.id}
                    className="hover:bg-accent/50 cursor-pointer h-10"
                    onDoubleClick={() => startEdit(compensation)}
                  >
                    <TableCell className="w-8 py-2">
                      <StatusDot status={compensation["Fortnox status"]} />
                    </TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      {compensation["Upplagd av"] || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      {compensation["Avser Mån/år"] &&
                        new Date(
                          compensation["Avser Mån/år"] + "-01"
                        ).toLocaleDateString("sv-SE", {
                          month: "long",
                          year: "numeric",
                        })}
                    </TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      {compensation.Ledare || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      {compensation.Kostnadsställe || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      {compensation.Aktivitetstyp || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {compensation.Antal || 0}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {formatCurrency(compensation.Ersättning || 0)}
                    </TableCell>
                    <TableCell className="py-2 text-xs font-medium">
                      {formatCurrency(
                        calculateTotal(
                          compensation.Antal || 0,
                          compensation.Ersättning || 0
                        )
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {compensation["Datum utbet"]
                        ? new Date(
                            compensation["Datum utbet"]
                          ).toLocaleDateString("sv-SE")
                        : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs max-w-[120px] truncate">
                      {compensation["Eventuell kommentar"] || "—"}
                    </TableCell>
                    <TableCell className="py-2 sticky right-0">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(compensation)}
                          className="h-7 w-7 p-0 hover:bg-muted"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(compensation.id!)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

            {/* Add Form Row */}
            {showAddForm && (
              <TableRow className="bg-muted/20 h-10">
                <TableCell className="p-1 w-8">
                  <StatusDot status="pending" />
                </TableCell>
                <TableCell className="py-2 p-1">
                  <Input
                    value={formData["Upplagd av"]}
                    onChange={(e) =>
                      setFormData({ ...formData, "Upplagd av": e.target.value })
                    }
                    placeholder="Upplagd av"
                    className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                  />
                </TableCell>
                <TableCell className="py-2 p-1">
                  <Select
                    value={formData["Avser Mån/år"]}
                    onValueChange={(value) =>
                      setFormData({ ...formData, "Avser Mån/år": value })
                    }
                  >
                    <SelectTrigger className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs">
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
                <TableCell className="py-2 p-1">
                  <SearchablePersonnelSelect
                    value={formData.Ledare}
                    onValueChange={(value) =>
                      setFormData({ ...formData, Ledare: value })
                    }
                    placeholder="Välj ledare"
                    className="[&>div>button]:border-0 [&>div>button]:bg-transparent [&>div>button]:rounded-none [&>div>button]:shadow-none [&>div>button]:focus:bg-background [&>div>button]:focus:shadow-sm [&>div>button]:h-auto [&>div>button]:text-xs"
                  />
                </TableCell>
                <TableCell className="py-2 p-1">
                  <Select
                    value={formData.Kostnadsställe}
                    onValueChange={(value) =>
                      setFormData({ ...formData, Kostnadsställe: value })
                    }
                  >
                    <SelectTrigger className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs">
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
                <TableCell className="py-2 p-1">
                  <Input
                    value={formData.Aktivitetstyp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Aktivitetstyp: e.target.value,
                      })
                    }
                    placeholder="Aktivitetstyp"
                    className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                  />
                </TableCell>
                <TableCell className="py-2 p-1">
                  <Input
                    type="number"
                    value={formData.Antal || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Antal:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    min="0"
                    step="1"
                    placeholder="Antal"
                    className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </TableCell>
                <TableCell className="py-2 p-1">
                  <Input
                    type="number"
                    value={formData.Ersättning || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Ersättning:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                    placeholder="Ersättning"
                    className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </TableCell>
                <TableCell className="py-2 p-1">
                  <span className="font-medium text-xs">
                    {formatCurrency(
                      calculateTotal(formData.Antal, formData.Ersättning)
                    )}
                  </span>
                </TableCell>
                <TableCell className="py-2 p-1">
                  <Input
                    type="date"
                    value={formData["Datum utbet"]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        "Datum utbet": e.target.value,
                      })
                    }
                    className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                  />
                </TableCell>
                <TableCell className="py-2 p-1">
                  <Input
                    value={formData["Eventuell kommentar"]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        "Eventuell kommentar": e.target.value,
                      })
                    }
                    placeholder="Kommentar..."
                    className="border-0 bg-transparent focus:bg-background rounded-none shadow-none focus:shadow-sm h-auto text-xs"
                  />
                </TableCell>
                <TableCell className="py-2 sticky right-0 bg-background">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      onClick={handleAdd}
                      className="h-7 w-7 p-0"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Empty State */}
            {compensations.length === 0 && !showAddForm && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center py-12 text-muted-foreground"
                >
                  Inga ersättningar registrerade
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Add Button */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAddForm(true);
            resetForm();
          }}
          className="flex items-center space-x-2"
        >
          <Plus className="h-3 w-3" />
          <span>Ny ersättning</span>
        </Button>
      </div>
    </div>
  );
}
