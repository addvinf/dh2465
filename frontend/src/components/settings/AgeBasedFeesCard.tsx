import { useState } from "react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Edit3, Plus, Trash2, Save, X } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import type { AgeBasedFee } from "../../types/settings";
import { useToast } from "../../hooks/use-toast";

interface EditableRowProps {
  fee: AgeBasedFee;
  onSave: (fee: AgeBasedFee) => void;
  onCancel: () => void;
}

function EditableRow({ fee, onSave, onCancel }: EditableRowProps) {
  const [editedFee, setEditedFee] = useState(fee);

  const handleSave = () => {
    if (!editedFee.ageGroup.trim() || editedFee.feeRate <= 0) {
      return;
    }
    onSave(editedFee);
  };

  return (
    <TableRow>
      <TableCell>
        <Input
          value={editedFee.ageGroup}
          onChange={(e) =>
            setEditedFee({ ...editedFee, ageGroup: e.target.value })
          }
          placeholder="t.ex. 18-25 år"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={editedFee.feeRate}
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
    ageGroup: "",
    feeRate: 0,
    description: "",
  });

  const handleAdd = () => {
    if (!newFee.ageGroup.trim() || newFee.feeRate <= 0) {
      return;
    }
    onAdd(newFee);
    setNewFee({ ageGroup: "", feeRate: 0, description: "" });
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
            <label className="text-sm font-medium">Åldersgrupp</label>
            <Input
              value={newFee.ageGroup}
              onChange={(e) =>
                setNewFee({ ...newFee, ageGroup: e.target.value })
              }
              placeholder="t.ex. 18-25 år"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Arbetsgivaravgift (%)</label>
            <Input
              type="number"
              value={newFee.feeRate}
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

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = async (fee: AgeBasedFee) => {
    try {
      await updateAgeBasedFee(fee.id, {
        ageGroup: fee.ageGroup,
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
          Åldersbaserade avgifter
        </CardTitle>
        <AddFeeDialog onAdd={handleAdd} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Åldersgrupp</TableHead>
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
                  <TableCell>{fee.ageGroup}</TableCell>
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
