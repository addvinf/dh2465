import { Plus, Save, X } from "lucide-react";
import { TableRow, TableCell } from "../../ui/table";
import { Button } from "../../ui/Button";
import { StatusDot } from "./StatusDot";
import { CompensationFormField } from "./CompensationFormField";

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

interface CompensationAddRowProps {
  showAddForm: boolean;
  formData: CompensationFormData;
  onFormDataChange: (data: CompensationFormData) => void;
  onAdd: () => void;
  onCancel: () => void;
  onShowAddForm: () => void;
  formatCurrency: (amount: number) => string;
  calculateTotal: (antal: number, ersattning: number) => number;
}

export function CompensationAddRow({
  showAddForm,
  formData,
  onFormDataChange,
  onAdd,
  onCancel,
  onShowAddForm,
  formatCurrency,
  calculateTotal,
}: CompensationAddRowProps) {
  const updateFormField = (
    field: keyof CompensationFormData,
    value: string | number
  ) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  if (!showAddForm) {
    return (
      <TableRow>
        <TableCell colSpan={12} className="text-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onShowAddForm}
            className="flex items-center space-x-2"
          >
            <Plus className="h-3 w-3" />
            <span>Ny ersättning</span>
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="bg-muted/20 h-10">
      <TableCell className="p-1 w-8">
        <StatusDot status="pending" />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="text"
          value={formData["Upplagd av"]}
          onChange={(value) => updateFormField("Upplagd av", value)}
          placeholder="Upplagd av"
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="month-select"
          value={formData["Avser Mån/år"]}
          onChange={(value) => updateFormField("Avser Mån/år", value)}
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="personnel-select"
          value={formData.Ledare}
          onChange={(value) => updateFormField("Ledare", value)}
          placeholder="Välj ledare"
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="cost-center-search"
          value={formData.Kostnadsställe}
          onChange={(value) => updateFormField("Kostnadsställe", value)}
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="activity-type-search"
          value={formData.Aktivitetstyp}
          onChange={(value) => updateFormField("Aktivitetstyp", value)}
          placeholder="Aktivitetstyp"
          useTooltip={true}
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="number"
          value={formData.Antal}
          onChange={(value) => updateFormField("Antal", value)}
          placeholder="Antal"
          min="0"
          step="1"
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="number"
          value={formData.Ersättning}
          onChange={(value) => updateFormField("Ersättning", value)}
          placeholder="Ersättning"
          min="0"
          step="0.01"
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <span className="font-medium text-xs">
          {formatCurrency(calculateTotal(formData.Antal, formData.Ersättning))}
        </span>
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="date"
          value={formData["Datum utbet"]}
          onChange={(value) => updateFormField("Datum utbet", value)}
        />
      </TableCell>
      <TableCell className="py-2 p-1">
        <CompensationFormField
          type="text"
          value={formData["Eventuell kommentar"]}
          onChange={(value) => updateFormField("Eventuell kommentar", value)}
          placeholder="Kommentar..."
        />
      </TableCell>
      <TableCell className="py-2 sticky right-0">
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <span className="sr-only">Spara</span>
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <span className="sr-only">Avbryt</span>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
