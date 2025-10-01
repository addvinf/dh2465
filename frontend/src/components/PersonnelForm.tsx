import { Plus } from "lucide-react";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { usePersonnelForm } from "../hooks/usePersonnelForm";
import { ValidationWarnings } from "./personnel/ValidationWarnings";
import { PersonalInfoSection } from "./personnel/PersonalInfoSection";
import { FinancialInfoSection } from "./personnel/FinancialInfoSection";
import type { PersonnelFormProps } from "../types/personnel";

export function PersonnelForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  loading = false,
}: PersonnelFormProps) {
  const {
    formData,
    setFormData,
    errors,
    warnings,
    handleInputChange,
    handleFieldBlur,
    handleSubmit,
    getFieldWarnings,
  } = usePersonnelForm({ isOpen, initialData, onSubmit });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] flex flex-col max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="mr-2 h-6 w-6" />
            {initialData.id ? "Redigera person" : "Lägg till person"}
          </DialogTitle>
          <DialogDescription>
            {initialData.id
              ? "Uppdatera informationen för denna person."
              : "Fyll i informationen för att lägga till en ny person i systemet."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <PersonalInfoSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              getFieldWarnings={getFieldWarnings}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur}
            />

            <FinancialInfoSection
              formData={formData}
              getFieldWarnings={getFieldWarnings}
              onInputChange={handleInputChange}
            />

            <ValidationWarnings warnings={warnings} />
          </form>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Sparar..." : initialData.id ? "Uppdatera" : "Lägg till"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
