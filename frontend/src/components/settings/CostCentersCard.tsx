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
import type { CostCenter } from "../../types/settings";
import { useToast } from "../../hooks/use-toast";

interface EditableRowProps {
  costCenter: CostCenter;
  onSave: (costCenter: CostCenter) => void;
  onCancel: () => void;
}

function EditableRow({ costCenter, onSave, onCancel }: EditableRowProps) {
  const [editedCostCenter, setEditedCostCenter] = useState(costCenter);

  const handleSave = () => {
    if (!editedCostCenter.code.trim() || !editedCostCenter.name.trim()) {
      return;
    }
    onSave(editedCostCenter);
  };

  return (
    <TableRow>
      <TableCell>
        <Input
          value={editedCostCenter.code}
          onChange={(e) =>
            setEditedCostCenter({ ...editedCostCenter, code: e.target.value })
          }
          placeholder="Kod"
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          value={editedCostCenter.name}
          onChange={(e) =>
            setEditedCostCenter({ ...editedCostCenter, name: e.target.value })
          }
          placeholder="Namn"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          value={editedCostCenter.description}
          onChange={(e) =>
            setEditedCostCenter({
              ...editedCostCenter,
              description: e.target.value,
            })
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

interface AddCostCenterDialogProps {
  onAdd: (costCenter: Omit<CostCenter, "id">) => void;
}

function AddCostCenterDialog({ onAdd }: AddCostCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const [newCostCenter, setNewCostCenter] = useState({
    code: "",
    name: "",
    description: "",
  });

  const handleAdd = () => {
    if (!newCostCenter.code.trim() || !newCostCenter.name.trim()) {
      return;
    }
    onAdd(newCostCenter);
    setNewCostCenter({ code: "", name: "", description: "" });
    setOpen(false);
  };

  const resetForm = () => {
    setNewCostCenter({ code: "", name: "", description: "" });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3 w-3 mr-1" />
          Lägg till kostnadsställe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till nytt kostnadsställe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Kod</label>
            <Input
              value={newCostCenter.code}
              onChange={(e) =>
                setNewCostCenter({ ...newCostCenter, code: e.target.value })
              }
              placeholder="t.ex. 100"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Namn</label>
            <Input
              value={newCostCenter.name}
              onChange={(e) =>
                setNewCostCenter({ ...newCostCenter, name: e.target.value })
              }
              placeholder="t.ex. Administration"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Beskrivning</label>
            <Input
              value={newCostCenter.description}
              onChange={(e) =>
                setNewCostCenter({
                  ...newCostCenter,
                  description: e.target.value,
                })
              }
              placeholder="Beskrivning av kostnadsställe"
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

export function CostCentersCard() {
  const { settings, addCostCenter, updateCostCenter, deleteCostCenter } =
    useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = async (costCenter: CostCenter) => {
    try {
      await updateCostCenter(costCenter.id, {
        code: costCenter.code,
        name: costCenter.name,
        description: costCenter.description,
      });
      setEditingId(null);
      toast({
        title: "Sparad",
        description: "Kostnadsstället har uppdaterats",
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

  const handleAdd = async (newCostCenter: Omit<CostCenter, "id">) => {
    try {
      await addCostCenter(newCostCenter);
      toast({
        title: "Tillagt",
        description: "Nytt kostnadsställe har lagts till",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kostnadsställe",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm("Är du säker på att du vill ta bort detta kostnadsställe?")
    ) {
      try {
        await deleteCostCenter(id);
        toast({
          title: "Borttaget",
          description: "Kostnadsstället har tagits bort",
        });
      } catch (error) {
        toast({
          title: "Fel",
          description: "Kunde inte ta bort kostnadsställe",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="financial-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-foreground">
          Kostnadsställen
        </CardTitle>
        <AddCostCenterDialog onAdd={handleAdd} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Namn</TableHead>
              <TableHead>Beskrivning</TableHead>
              <TableHead>Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.costCenters.map((costCenter) =>
              editingId === costCenter.id ? (
                <EditableRow
                  key={costCenter.id}
                  costCenter={costCenter}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <TableRow key={costCenter.id}>
                  <TableCell className="font-mono w-20">
                    {costCenter.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {costCenter.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {costCenter.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(costCenter.id)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(costCenter.id)}
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
        {settings.costCenters.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Inga kostnadsställen har lagts till än.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
