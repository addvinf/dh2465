import { useState } from "react";
import { Button } from "../../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Edit3, Plus, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { useSettings } from "../../../contexts/SettingsContext";
import type { AgeBasedFee } from "../../../types/settings";
import { useToast } from "../../../hooks/use-toast";
import { validateAgeBasedFees } from "../../../utils/ageBasedFeeUtils";

interface EditableRowProps {
  fee: AgeBasedFee;
  onSave: (fee: AgeBasedFee) => void;
  onCancel: () => void;
}

function EditableRow({ fee, onSave, onCancel }: EditableRowProps) {
  const [editedFee, setEditedFee] = useState(fee);

  const handleSave = () => {
    if (editedFee.lowerBound < 0 || editedFee.feeRate <= 0) {
      return;
    }
    if (
      editedFee.upperBound !== null &&
      editedFee.upperBound <= editedFee.lowerBound
    ) {
      return;
    }
    onSave(editedFee);
  };

  return (
    <TableRow>
      <TableCell>
        <Input
          type="number"
          value={editedFee.lowerBound || ""}
          onChange={(e) =>
            setEditedFee({
              ...editedFee,
              lowerBound: parseInt(e.target.value) || 0,
            })
          }
          min="0"
          max="120"
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={editedFee.upperBound || ""}
          onChange={(e) =>
            setEditedFee({
              ...editedFee,
              upperBound: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          min={String(Math.max(0, (editedFee.lowerBound || 0) + 1))}
          max="120"
          placeholder="Ingen gräns"
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={editedFee.feeRate || ""}
            onChange={(e) =>
              setEditedFee({
                ...editedFee,
                feeRate: parseFloat(e.target.value) || 0,
              })
            }
            step="0.01"
            min="0"
            max="100"
            className="h-8 w-20"
          />
          <span>%</span>
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={editedFee.description}
          onChange={(e) =>
            setEditedFee({ ...editedFee, description: e.target.value })
          }
          placeholder="Beskrivning"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface AddFeeDialogProps {
  onAdd: (fee: Omit<AgeBasedFee, "id">) => void;
}

function AddFeeDialog({ onAdd }: AddFeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [newFee, setNewFee] = useState({
    lowerBound: 0,
    upperBound: null as number | null,
    feeRate: 0,
    description: "",
  });

  const handleAdd = () => {
    if (newFee.lowerBound < 0 || newFee.feeRate <= 0) {
      return;
    }
    if (newFee.upperBound !== null && newFee.upperBound <= newFee.lowerBound) {
      return;
    }
    onAdd(newFee);
    setNewFee({ lowerBound: 0, upperBound: null, feeRate: 0, description: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3 w-3 mr-1" />
          Lägg till åldersgrupp
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till ny åldersbaserad avgift</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Lägsta ålder</label>
            <Input
              type="number"
              value={newFee.lowerBound || ""}
              onChange={(e) =>
                setNewFee({
                  ...newFee,
                  lowerBound: parseInt(e.target.value) || 0,
                })
              }
              min="0"
              max="120"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Högsta ålder (lämna tom för ingen gräns)
            </label>
            <Input
              type="number"
              value={newFee.upperBound || ""}
              onChange={(e) =>
                setNewFee({
                  ...newFee,
                  upperBound: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              min={String(Math.max(0, (newFee.lowerBound || 0) + 1))}
              max="120"
              placeholder="Ingen gräns"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Arbetsgivaravgift (%)</label>
            <Input
              type="number"
              value={newFee.feeRate || ""}
              onChange={(e) =>
                setNewFee({
                  ...newFee,
                  feeRate: parseFloat(e.target.value) || 0,
                })
              }
              step="0.01"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Beskrivning</label>
            <Input
              value={newFee.description}
              onChange={(e) =>
                setNewFee({ ...newFee, description: e.target.value })
              }
              placeholder="Beskrivning av avgiften"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAdd}>Lägg till</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgeBasedFeesCard() {
  const { settings, addAgeBasedFee, updateAgeBasedFee, deleteAgeBasedFee } =
    useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Validate the current age-based fees
  const validation = validateAgeBasedFees(settings.ageBasedFees);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = async (fee: AgeBasedFee) => {
    try {
      await updateAgeBasedFee(fee.id, {
        lowerBound: fee.lowerBound,
        upperBound: fee.upperBound,
        feeRate: fee.feeRate,
        description: fee.description,
      });
      setEditingId(null);
      toast({
        title: "Sparad",
        description: "Åldersbaserad avgift har uppdaterats",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara ändringar",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAdd = async (newFee: Omit<AgeBasedFee, "id">) => {
    // Validate the new fee before adding
    const tempFees = [...settings.ageBasedFees, { ...newFee, id: "temp" }];
    const validation = validateAgeBasedFees(tempFees);

    if (!validation.isValid) {
      toast({
        title: "Valideringsfel",
        description: validation.errors[0] || "Ogiltig avgiftskonfiguration",
        variant: "destructive",
      });
      return;
    }

    try {
      await addAgeBasedFee(newFee);
      toast({
        title: "Tillagd",
        description: "Ny åldersbaserad avgift har lagts till",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till avgift",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Är du säker på att du vill ta bort denna avgift?")) {
      try {
        await deleteAgeBasedFee(id);
        toast({
          title: "Borttagen",
          description: "Åldersbaserad avgift har tagits bort",
        });
      } catch (error) {
        toast({
          title: "Fel",
          description: "Kunde inte ta bort avgift",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="financial-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-foreground">
          Åldersbaserade arbetsgivaravgifter
        </CardTitle>
        <AddFeeDialog onAdd={handleAdd} />
      </CardHeader>
      <CardContent>
        {/* Validation warnings */}
        {(!validation.isValid || validation.warnings.length > 0) && (
          <div className="mb-4 space-y-2">
            {validation.errors.map((error, index) => (
              <div
                key={`error-${index}`}
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="flex items-center gap-2 text-sm text-yellow-600"
              >
                <AlertTriangle className="h-4 w-4" />
                {warning}
              </div>
            ))}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Från ålder</TableHead>
              <TableHead>Till ålder</TableHead>
              <TableHead>Arbetsgivaravgift</TableHead>
              <TableHead>Beskrivning</TableHead>
              <TableHead>Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.ageBasedFees.map((fee) =>
              editingId === fee.id ? (
                <EditableRow
                  key={fee.id}
                  fee={fee}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <TableRow key={fee.id}>
                  <TableCell>{fee.lowerBound}</TableCell>
                  <TableCell>{fee.upperBound ?? "Ingen gräns"}</TableCell>
                  <TableCell>{fee.feeRate}%</TableCell>
                  <TableCell>{fee.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(fee.id)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fee.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
        {settings.ageBasedFees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Inga åldersbaserade avgifter har lagts till än.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
