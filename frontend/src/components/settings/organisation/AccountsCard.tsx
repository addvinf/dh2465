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
import type { Account } from "../../../types/settings";
import { useToast } from "../../../hooks/use-toast";
import { AccountForm, ACCOUNT_TYPES } from "./AccountForm";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountName: string;
}

function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  accountName,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bekräfta borttagning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Är du säker på att du vill ta bort kontot{" "}
            <strong>{accountName}</strong>?
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

export function AccountsCard() {
  const { settings, addAccount, updateAccount, deleteAccount } = useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = async (account: Account) => {
    try {
      await updateAccount(account.id, {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        type: account.type,
      });
      setEditingId(null);
      toast({
        title: "Sparad",
        description: "Kontot har uppdaterats",
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

  const handleAdd = async (newAccount: Omit<Account, "id">) => {
    try {
      await addAccount(newAccount);
      setAddDialogOpen(false);
      toast({
        title: "Tillagt",
        description: "Nytt konto har lagts till",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till konto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      await deleteAccount(accountToDelete.id);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      toast({
        title: "Borttaget",
        description: "Kontot har tagits bort",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort konto",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = ACCOUNT_TYPES.find((t) => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  return (
    <>
      <Card className="financial-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-foreground">
            Bokföringskonton
          </CardTitle>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" />
                Lägg till konto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lägg till nytt bokföringskonto</DialogTitle>
              </DialogHeader>
              <AccountForm
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
                <TableHead>Kontonummer</TableHead>
                <TableHead>Kontonamn</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.accounts.map((account) =>
                editingId === account.id ? (
                  <TableRow key={account.id}>
                    <TableCell colSpan={4} className="p-4">
                      <AccountForm
                        mode="edit"
                        account={account}
                        onSave={handleSave}
                        onCancel={handleCancel}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">
                      {account.accountNumber}
                    </TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground">
                        {getTypeLabel(account.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(account.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(account)}
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
          {settings.accounts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Inga bokföringskonton har lagts till än.
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        accountName={accountToDelete?.accountName || ""}
      />
    </>
  );
}
