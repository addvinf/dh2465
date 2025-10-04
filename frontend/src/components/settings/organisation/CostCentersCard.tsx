import { useState } from "react";
import { Button } from "../../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
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
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useSettings } from "../../../contexts/SettingsContext";
import type { CostCenter } from "../../../types/settings";
import { useToast } from "../../../hooks/use-toast";
import { CostCenterForm } from "./CostCenterForm";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  costCenterName: string;
}

function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  costCenterName,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bekräfta borttagning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Är du säker på att du vill ta bort kostnadsstället{" "}
            <strong>{costCenterName}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            Denna åtgärd kan inte ångras.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Ta bort
            </Button>
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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costCenterToDelete, setCostCenterToDelete] =
    useState<CostCenter | null>(null);

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
      setAddDialogOpen(false);
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

  const handleDeleteClick = (costCenter: CostCenter) => {
    setCostCenterToDelete(costCenter);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!costCenterToDelete) return;

    try {
      await deleteCostCenter(costCenterToDelete.id);
      setDeleteDialogOpen(false);
      setCostCenterToDelete(null);
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
  };

  return (
    <>
      <Card className="financial-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-foreground">
            Kostnadsställen
          </CardTitle>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
              <CostCenterForm
                mode="create"
                onAdd={handleAdd}
                onSave={handleSave}
                onCancel={() => setAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
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
                  <TableRow key={costCenter.id}>
                    <TableCell colSpan={4} className="p-4">
                      <CostCenterForm
                        mode="edit"
                        costCenter={costCenter}
                        onSave={handleSave}
                        onCancel={handleCancel}
                      />
                    </TableCell>
                  </TableRow>
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
                          onClick={() => handleDeleteClick(costCenter)}
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

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        costCenterName={costCenterToDelete?.name || ""}
      />
    </>
  );
}
