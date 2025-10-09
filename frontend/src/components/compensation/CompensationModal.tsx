import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useSettings } from "../../contexts/SettingsContext";
import type { CompensationRecord } from "../../types/compensation";

interface CompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<CompensationRecord, "id"> | CompensationRecord
  ) => Promise<void>;
  compensation?: CompensationRecord; // If provided, we're editing
  defaultPersonName?: string; // For adding to specific person
}

interface FormData {
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

export function CompensationModal({
  isOpen,
  onClose,
  onSave,
  compensation,
  defaultPersonName = "",
}: CompensationModalProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    "Upplagd av": settings.organization?.contactPerson || "",
    "Avser Mån/år": "",
    Ledare: defaultPersonName,
    Kostnadsställe: "",
    Aktivitetstyp: "",
    Antal: 1,
    Ersättning: 0,
    "Datum utbet": "",
    "Eventuell kommentar": "",
  });

  const isEditing = !!compensation;

  useEffect(() => {
    if (isOpen) {
      if (compensation) {
        // Editing existing compensation
        setFormData({
          "Upplagd av": compensation["Upplagd av"] || "",
          "Avser Mån/år": compensation["Avser Mån/år"] || "",
          Ledare: compensation.Ledare || "",
          Kostnadsställe: compensation.Kostnadsställe || "",
          Aktivitetstyp: compensation.Aktivitetstyp || "",
          Antal: compensation.Antal || 1,
          Ersättning: compensation.Ersättning || 0,
          "Datum utbet": compensation["Datum utbet"] || "",
          "Eventuell kommentar": compensation["Eventuell kommentar"] || "",
        });
      } else {
        // Adding new compensation
        setFormData({
          "Upplagd av": settings.organization?.contactPerson || "",
          "Avser Mån/år": "",
          Ledare: defaultPersonName,
          Kostnadsställe: "",
          Aktivitetstyp: "",
          Antal: 1,
          Ersättning: 0,
          "Datum utbet": "",
          "Eventuell kommentar": "",
        });
      }
    }
  }, [
    isOpen,
    compensation,
    defaultPersonName,
    settings.organization?.contactPerson,
  ]);

  const calculateTotal = () => {
    return formData.Antal * formData.Ersättning;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
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

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.Ledare.trim()) errors.push("Ledare");
    if (!formData["Avser Mån/år"]) errors.push("Månad/år");
    if (!formData.Kostnadsställe) errors.push("Kostnadsställe");
    if (!formData.Aktivitetstyp.trim()) errors.push("Aktivitetstyp");
    if (formData.Antal <= 0) errors.push("Antal måste vara större än 0");
    if (formData.Ersättning <= 0)
      errors.push("Ersättning måste vara större än 0");

    if (errors.length > 0) {
      alert(`Vänligen fyll i följande fält korrekt:\n• ${errors.join("\n• ")}`);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const totalCompensation = calculateTotal();

      if (isEditing && compensation) {
        await onSave({
          ...compensation,
          ...formData,
          "Total ersättning": totalCompensation,
        });
      } else {
        await onSave({
          ...formData,
          "Total ersättning": totalCompensation,
          "Fortnox status": "pending",
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to save compensation:", error);
      alert("Kunde inte spara ersättning. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Redigera ersättning" : "Lägg till ersättning"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Upplagd av
              </label>
              <Input
                value={formData["Upplagd av"]}
                onChange={(e) =>
                  setFormData({ ...formData, "Upplagd av": e.target.value })
                }
                placeholder="Namn på person som registrerar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Månad/år <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData["Avser Mån/år"]}
                onValueChange={(value) =>
                  setFormData({ ...formData, "Avser Mån/år": value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj månad och år" />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Ledare <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.Ledare}
                onChange={(e) =>
                  setFormData({ ...formData, Ledare: e.target.value })
                }
                placeholder="Namn på ledare"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Kostnadsställe <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.Kostnadsställe}
                onValueChange={(value) =>
                  setFormData({ ...formData, Kostnadsställe: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kostnadsställe" />
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
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Aktivitetstyp <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.Aktivitetstyp}
              onChange={(e) =>
                setFormData({ ...formData, Aktivitetstyp: e.target.value })
              }
              placeholder="T.ex. Tränararvode, Föreläsning, Ledarskap"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Antal <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.Antal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Antal: Number(e.target.value) || 0,
                  })
                }
                min="1"
                step="1"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Ersättning (kr) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.Ersättning}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Ersättning: Number(e.target.value) || 0,
                  })
                }
                min="0"
                step="0.01"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Total ersättning
              </label>
              <div className="h-10 flex items-center px-3 border border-border bg-muted rounded-md">
                <span className="font-medium text-lg">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Datum utbetalning
            </label>
            <Input
              type="date"
              value={formData["Datum utbet"]}
              onChange={(e) =>
                setFormData({ ...formData, "Datum utbet": e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kommentar</label>
            <Input
              value={formData["Eventuell kommentar"]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  "Eventuell kommentar": e.target.value,
                })
              }
              placeholder="Valfri kommentar..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Sparar..." : isEditing ? "Uppdatera" : "Lägg till"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
