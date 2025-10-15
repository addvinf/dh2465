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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
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
  const { settings } = useSettings();
  const [editedSalaryType, setEditedSalaryType] = useState(salaryType);

  const handleSave = () => {
    if (
      !editedSalaryType.name.trim() ||
      !editedSalaryType.account ||
      !editedSalaryType.costCenter ||
      !editedSalaryType.category
    ) {
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
        <Select
          value={editedSalaryType.account}
          onValueChange={(value) =>
            setEditedSalaryType({ ...editedSalaryType, account: value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {settings.accounts.map((account) => (
              <SelectItem key={account.id} value={account.accountNumber}>
                {account.accountNumber} - {account.accountName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={editedSalaryType.costCenter}
          onValueChange={(value) =>
            setEditedSalaryType({ ...editedSalaryType, costCenter: value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {settings.costCenters.map((costCenter) => (
              <SelectItem key={costCenter.id} value={costCenter.code}>
                {costCenter.code} - {costCenter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={editedSalaryType.category}
          onValueChange={(value: "sports" | "regular") =>
            setEditedSalaryType({ ...editedSalaryType, category: value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sports">Idrottsutövare</SelectItem>
            <SelectItem value="regular">Ordinarie</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={editedSalaryType.vacationRate || ""}
          onChange={(e) =>
            setEditedSalaryType({
              ...editedSalaryType,
              vacationRate: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          placeholder="0"
          step="0.1"
          min="0"
          max="50"
          className="h-8 w-16"
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
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [newSalaryType, setNewSalaryType] = useState<{
    name: string;
    account: string;
    costCenter: string;
    category: "sports" | "regular";
    vacationRate: number | null;
  }>({
    name: "",
    account: "",
    costCenter: "",
    category: "regular",
    vacationRate: null,
  });

  const handleAdd = () => {
    if (
      !newSalaryType.name.trim() ||
      !newSalaryType.account ||
      !newSalaryType.costCenter
    ) {
      return;
    }
    onAdd(newSalaryType);
    setNewSalaryType({
      name: "",
      account: "",
      costCenter: "",
      category: "regular",
      vacationRate: null,
    });
    setOpen(false);
  };

  const resetForm = () => {
    setNewSalaryType({
      name: "",
      account: "",
      costCenter: "",
      category: "regular",
      vacationRate: null,
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
            <label className="text-sm font-medium">Namn</label>
            <Input
              value={newSalaryType.name}
              onChange={(e) =>
                setNewSalaryType({ ...newSalaryType, name: e.target.value })
              }
              placeholder="t.ex. Grundlön"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Konto</label>
            <Select
              value={newSalaryType.account}
              onValueChange={(value) =>
                setNewSalaryType({ ...newSalaryType, account: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj konto" />
              </SelectTrigger>
              <SelectContent>
                {settings.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.accountNumber}>
                    {account.accountNumber} - {account.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Kostnadsställe</label>
            <Select
              value={newSalaryType.costCenter}
              onValueChange={(value) =>
                setNewSalaryType({ ...newSalaryType, costCenter: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kostnadsställe" />
              </SelectTrigger>
              <SelectContent>
                {settings.costCenters.map((costCenter) => (
                  <SelectItem key={costCenter.id} value={costCenter.code}>
                    {costCenter.code} - {costCenter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Kategori</label>
            <Select
              value={newSalaryType.category}
              onValueChange={(value: "sports" | "regular") =>
                setNewSalaryType({ ...newSalaryType, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sports">Idrottsutövare</SelectItem>
                <SelectItem value="regular">Ordinarie</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Idrottsutövare har lägre arbetsgivaravgifter enligt svenska
              skatteregler
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">
              Semesterersättning (%)
            </label>
            <Input
              type="number"
              value={newSalaryType.vacationRate || ""}
              onChange={(e) =>
                setNewSalaryType({
                  ...newSalaryType,
                  vacationRate: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                })
              }
              placeholder="12"
              step="0.1"
              min="0"
              max="50"
            />
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
        account: salaryType.account,
        costCenter: salaryType.costCenter,
        category: salaryType.category,
        vacationRate: salaryType.vacationRate,
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
              <TableHead>Konto</TableHead>
              <TableHead>Kostnadsställe</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Semester</TableHead>
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
                    {salaryType.account}
                  </TableCell>
                  <TableCell className="font-mono">
                    {salaryType.costCenter}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-md text-xs ${
                        salaryType.category === "sports"
                          ? "bg-primary-muted text-primary"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {salaryType.category === "sports"
                        ? "Idrottsutövare"
                        : "Ordinarie"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {salaryType.vacationRate
                      ? `${salaryType.vacationRate}%`
                      : "-"}
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
