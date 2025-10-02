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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Edit3, Plus, Trash2, Save, X } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import type { Account } from "../../types/settings";
import { useToast } from "../../hooks/use-toast";

const ACCOUNT_TYPES = [
  { value: "tillgång", label: "Tillgång" },
  { value: "skuld", label: "Skuld" },
  { value: "eget_kapital", label: "Eget kapital" },
  { value: "intäkt", label: "Intäkt" },
  { value: "kostnad", label: "Kostnad" },
];

interface EditableRowProps {
  account: Account;
  onSave: (account: Account) => void;
  onCancel: () => void;
}

function EditableRow({ account, onSave, onCancel }: EditableRowProps) {
  const [editedAccount, setEditedAccount] = useState(account);

  const handleSave = () => {
    if (
      !editedAccount.accountNumber.trim() ||
      !editedAccount.accountName.trim() ||
      !editedAccount.type
    ) {
      return;
    }
    onSave(editedAccount);
  };

  return (
    <TableRow>
      <TableCell>
        <Input
          value={editedAccount.accountNumber}
          onChange={(e) =>
            setEditedAccount({
              ...editedAccount,
              accountNumber: e.target.value,
            })
          }
          placeholder="Kontonummer"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          value={editedAccount.accountName}
          onChange={(e) =>
            setEditedAccount({ ...editedAccount, accountName: e.target.value })
          }
          placeholder="Kontonamn"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Select
          value={editedAccount.type}
          onValueChange={(value) =>
            setEditedAccount({ ...editedAccount, type: value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

interface AddAccountDialogProps {
  onAdd: (account: Omit<Account, "id">) => void;
}

function AddAccountDialog({ onAdd }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountNumber: "",
    accountName: "",
    type: "",
  });

  const handleAdd = () => {
    if (
      !newAccount.accountNumber.trim() ||
      !newAccount.accountName.trim() ||
      !newAccount.type
    ) {
      return;
    }
    onAdd(newAccount);
    setNewAccount({ accountNumber: "", accountName: "", type: "" });
    setOpen(false);
  };

  const resetForm = () => {
    setNewAccount({ accountNumber: "", accountName: "", type: "" });
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
          Lägg till konto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till nytt bokföringskonto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Kontonummer</label>
            <Input
              value={newAccount.accountNumber}
              onChange={(e) =>
                setNewAccount({ ...newAccount, accountNumber: e.target.value })
              }
              placeholder="t.ex. 1920"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Kontonamn</label>
            <Input
              value={newAccount.accountName}
              onChange={(e) =>
                setNewAccount({ ...newAccount, accountName: e.target.value })
              }
              placeholder="t.ex. Bankkonto"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Kontotyp</label>
            <Select
              value={newAccount.type}
              onValueChange={(value) =>
                setNewAccount({ ...newAccount, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kontotyp" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export function AccountsCard() {
  const { settings, addAccount, updateAccount, deleteAccount } = useSettings();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (window.confirm("Är du säker på att du vill ta bort detta konto?")) {
      try {
        await deleteAccount(id);
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
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = ACCOUNT_TYPES.find((t) => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  return (
    <Card className="financial-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-foreground">
          Bokföringskonton
        </CardTitle>
        <AddAccountDialog onAdd={handleAdd} />
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
                <EditableRow
                  key={account.id}
                  account={account}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
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
                        onClick={() => handleDelete(account.id)}
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
  );
}
