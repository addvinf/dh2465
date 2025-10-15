import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { PersonnelSearchInput } from "../../personnel/PersonnelPopup/PersonnelSearchInput";
import { CostCenterSearchInput } from "../../costcenter/CostCenterSearchInput";
import { SalaryTypeSearchInput } from "../../salarytype/SalaryTypeSearchInput";
import { useSettings } from "../../../contexts/SettingsContext";

interface CompensationFormFieldProps {
  type:
    | "text"
    | "number"
    | "date"
    | "month-select"
    | "cost-center-select"
    | "cost-center-search"
    | "salary-type-search"
    | "personnel-select";
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  min?: string;
  step?: string;
  className?: string;
  useTooltip?: boolean; // Add tooltip support for table usage
}

const baseInputClasses =
  "border-0 bg-transparent rounded-none shadow-none focus:shadow-sm h-auto text-xs";

export function CompensationFormField({
  type,
  value,
  onChange,
  placeholder,
  min,
  step,
  className = "",
  useTooltip = false, // Add tooltip support
}: CompensationFormFieldProps) {
  const { settings } = useSettings();

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
      const optionValue = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      options.push({ label: monthYear, value: optionValue });
    }
    return options;
  };

  switch (type) {
    case "text":
      return (
        <Input
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseInputClasses} ${className}`}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={value === 0 ? "" : value}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : Number(e.target.value))
          }
          min={min}
          step={step}
          placeholder={placeholder}
          className={`${baseInputClasses} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${className}`}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClasses} ${className}`}
        />
      );

    case "month-select":
      return (
        <Select value={value as string} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className={`${baseInputClasses} ${className}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {generateMonthOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "cost-center-select":
      return (
        <Select value={value as string} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className={`${baseInputClasses} ${className}`}>
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
      );

    case "personnel-select":
      return (
        <PersonnelSearchInput
          value={value as string}
          onChange={(val) => onChange(val)}
          placeholder={placeholder || "Skriv för att söka personal..."}
          className={`${baseInputClasses} ${className}`}
        />
      );

    case "cost-center-search":
      return (
        <CostCenterSearchInput
          value={value as string}
          onChange={(val) => onChange(val)}
          placeholder={placeholder || "Skriv för att söka kostnadsställe..."}
          className={`${baseInputClasses} ${className}`}
        />
      );

    case "salary-type-search":
      return (
        <SalaryTypeSearchInput
          value={value as string}
          onChange={(val) => onChange(val)}
          placeholder={placeholder || "Skriv för att söka löneart..."}
          className={`${baseInputClasses} ${className}`}
          hideError={useTooltip}
          useTooltip={useTooltip}
        />
      );

    default:
      return null;
  }
}
