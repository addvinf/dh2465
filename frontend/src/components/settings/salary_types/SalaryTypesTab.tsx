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
import { Plus, Edit3, Trash2, Save, X } from "lucide-react";
import { useSettings } from "../../../contexts/SettingsContext";
import type { SalaryType } from "../../../types/settings";
import { useToast } from "../../../hooks/use-toast";

interface EditableRowProps {
  salaryType: SalaryType;
  onSave: (salaryType: SalaryType) => void;
  onCancel: () => void;
}

function EditableRow({ salaryType, onSave, onCancel }: EditableRowProps) {
  const [editedSalaryType, setEditedSalaryType] = useState(salaryType);

  const handleSave = () => {
    if (!editedSalaryType.name.trim() || !editedSalaryType.code) {
      return;
    }
    onSave(editedSalaryType);
  };

  return (
    <TableRow>
      <TableCell>
        <Input
          value={editedSalaryType.name}
          onChange={(e) =>
            setEditedSalaryType({ ...editedSalaryType, name: e.target.value })
          }
          placeholder="Löneartens namn"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={editedSalaryType.code}
          onChange={(e) =>
            setEditedSalaryType({ 
              ...editedSalaryType, 
              code: Number(e.target.value) || 0 
            })
          }
          placeholder="Kod"
          className="h-8 w-20"
          min="0"
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

interface AddSalaryTypeDialogProps {
  onAdd: (salaryType: Omit<SalaryType, "id">) => void;
}

function AddSalaryTypeDialog({ onAdd }: AddSalaryTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [newSalaryType, setNewSalaryType] = useState<{
    name: string;
    code: number;
  }>({
    name: "",
    code: 0,
  });

  const handleAdd = () => {
    if (!newSalaryType.name.trim() || !newSalaryType.code) {
      return;
    }
    onAdd(newSalaryType);
    setNewSalaryType({
      name: "",
      code: 0,
    });
    setOpen(false);
  };

  const resetForm = () => {
    setNewSalaryType({
      name: "",
      code: 0,
    });
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
        <Button className="bg-secondary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Skapa ny löneart
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Skapa ny löneart</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Löneart</label>
            <Input
              value={newSalaryType.name}
              onChange={(e) =>
                setNewSalaryType({ ...newSalaryType, name: e.target.value })
              }
              placeholder="t.ex. Grundlön"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Kod</label>
            <Input
              type="number"
              value={newSalaryType.code}
              onChange={(e) =>
                setNewSalaryType({ 
                  ...newSalaryType, 
                  code: Number(e.target.value) || 0 
                })
              }
              placeholder="t.ex. 7120"
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Numrisk kod som kopplas till Fortnox
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAdd}>Skapa</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SalaryTypesTab() {
  const { settings, addSalaryType, updateSalaryType, deleteSalaryType } =
    useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = async (salaryType: SalaryType) => {
    try {
      await updateSalaryType(salaryType.id, {
        name: salaryType.name,
        code: salaryType.code,
      });
      setEditingId(null);
      toast({
        title: "Sparad",
        description: "Lönearten har uppdaterats",
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

  const handleAdd = async (newSalaryType: Omit<SalaryType, "id">) => {
    try {
      await addSalaryType(newSalaryType);
      toast({
        title: "Skapad",
        description: "Ny löneart har skapats",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte skapa löneart",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Är du säker på att du vill ta bort denna löneart?")) {
      try {
        await deleteSalaryType(id);
        toast({
          title: "Borttagen",
          description: "Lönearten har tagits bort",
        });
      } catch (error) {
        toast({
          title: "Fel",
          description: "Kunde inte ta bort löneart",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">Lönearter</CardTitle>
          <AddSalaryTypeDialog onAdd={handleAdd} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Löneart</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.salaryTypes.map((salaryType) =>
              editingId === salaryType.id ? (
                <EditableRow
                  key={salaryType.id}
                  salaryType={salaryType}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <TableRow key={salaryType.id}>
                  <TableCell className="font-medium">
                    {salaryType.name}
                  </TableCell>
                  <TableCell className="font-mono">
                    {salaryType.code}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(salaryType.id)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(salaryType.id)}
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
        {settings.salaryTypes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Inga lönearter har skapats än.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
