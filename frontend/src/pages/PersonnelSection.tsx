import { Button } from "../components/ui/Button";
import {
  fetchPersonnel,
  addPersonnel,
  updatePersonnel,
  togglePersonnelStatus,
  deletePersonnel,
} from "../services/personnelService";
import { Plus, Upload, RefreshCw } from "lucide-react";
import { Header } from "../components/Header";
import FortnoxPushButton from "../components/FortnoxPushButton";
import FortnoxBatchErrors from "../components/FortnoxBatchErrors";
import { useState, useEffect } from "react";
import { toast } from "../hooks/use-toast";
import { PersonnelTable } from "../components/PersonnelTable";
import { PersonnelForm } from "../components/PersonnelForm";
import { PersonnelExcelUpload } from "../components/personnel/PersonnelExcelUpload";
import { PersonnelExcelViewer } from "../components/personnel/PersonnelExcelViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import type { PersonnelRecord, ViewMode } from "../types/personnel";

export function PersonnelSection() {
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<
    PersonnelRecord | undefined
  >();
  const [formLoading, setFormLoading] = useState(false);
  const [batchErrors, setBatchErrors] = useState<any[]>([]);
  // New state for Excel upload modal
  const [excelUploadOpen, setExcelUploadOpen] = useState(false);
  const [excelData, setExcelData] = useState<Partial<PersonnelRecord>[]>([]);

  const loadPersonnel = async () => {
    setLoading(true);
    try {
      const result = await fetchPersonnel("test_förening");
      setPersonnel(result.data);
    } catch (err) {
      toast({
        description: "Kunde inte ladda personaldata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const handleAddPerson = () => {
    setEditingRecord(undefined);
    setFormOpen(true);
  };

  const handleEditPerson = (record: PersonnelRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Partial<PersonnelRecord>) => {
    setFormLoading(true);
    try {
      if (editingRecord?.id) {
        await updatePersonnel("test_förening", editingRecord.id, data);
      } else {
        await addPersonnel("test_förening", data);
      }

      setFormOpen(false);
      await loadPersonnel(); // Reload data
    } catch (err) {
      toast({
        description: editingRecord
          ? "Kunde inte uppdatera person"
          : "Kunde inte lägga till person",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handlePushComplete = async (result: { failures: number; successes: number; items: any[] }) => {
    const errors = (result.items || []).filter((i) => i.error);
    setBatchErrors(errors);
    await loadPersonnel();
  };

  // New Excel upload handlers
  const handleExcelUploadOpen = () => {
    setExcelUploadOpen(true);
  };

  const handleExcelDataUploaded = (data: Partial<PersonnelRecord>[]) => {
    setExcelData(data);
    setViewerOpen(true);
    setExcelUploadOpen(false);
  };

  const handleExcelError = (error: string) => {
    toast({
      description: error,
      variant: "destructive",
    });
  };

  const handleExcelSave = async (data: Partial<PersonnelRecord>[]) => {
    if (!data.length) {
      toast({
        description: "Ingen data att spara",
        variant: "destructive",
      });
      return;
    }

    try {
      // Filter out records without email (required field)
      const validRecords = data.filter(
        (record) => record["E-post"]
      );

      if (validRecords.length === 0) {
        toast({
          description: "Inga giltiga poster att spara (E-post krävs för alla)",
          variant: "destructive",
        });
        return;
      }

      // Process records for add/update based on existing emails
      const existingEmails = new Set(personnel.map((p) => p["E-post"]));
      const recordsToAdd: Partial<PersonnelRecord>[] = [];
      const recordsToUpdate: Partial<PersonnelRecord>[] = [];

      validRecords.forEach((record) => {
        if (existingEmails.has(record["E-post"]!)) {
          // Find existing record and update with new data
          const existingRecord = personnel.find(p => p["E-post"] === record["E-post"]);
          if (existingRecord) {
            recordsToUpdate.push({
              ...record,
              id: existingRecord.id,
            });
          }
        } else {
          recordsToAdd.push(record);
        }
      });

      // Execute updates and additions
      let successCount = 0;
      let errorCount = 0;

      for (const record of recordsToUpdate) {
        try {
          await updatePersonnel("test_förening", record.id!, record);
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      for (const record of recordsToAdd) {
        try {
          await addPersonnel("test_förening", record);
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      // Show results
      if (errorCount === 0) {
        toast({
          description: `${successCount} personer har sparats framgångsrikt`,
          variant: "default",
        });
      } else {
        toast({
          description: `${successCount} personer sparade, ${errorCount} fel uppstod`,
          variant: "destructive",
        });
      }

      // Reload data and close viewer
      await loadPersonnel();
      setViewerOpen(false);
      setExcelData([]);
    } catch (err) {
      toast({
        description: "Fel vid sparande av Excel-data",
        variant: "destructive",
      });
    }
  };

  const handleExcelCancel = () => {
    setViewerOpen(false);
    setExcelData([]);
  };

  const handleToggleStatus = async (record: PersonnelRecord) => {
    try {
      // Use the dedicated toggle endpoint
      await togglePersonnelStatus("test_förening", record.id!);

      toast({
        description: `${record["Förnamn"]} ${record["Efternamn"]} är nu ${
          !record.Aktiv ? "aktiv" : "inaktiv"
        }`,
        variant: "default",
      });

      await loadPersonnel(); // Reload data
    } catch (err) {
      toast({
        description: "Kunde inte uppdatera status",
        variant: "destructive",
      });
    }
  };

  const handleDeletePerson = async (record: PersonnelRecord) => {
    // Show confirmation dialog
    if (
      !confirm(
        `Är du säker på att du vill ta bort ${record["Förnamn"]} ${record["Efternamn"]}? Detta kan inte ångras.`
      )
    ) {
      return;
    }

    try {
      await deletePersonnel("test_förening", record.id!);

      toast({
        description: `${record["Förnamn"]} ${record["Efternamn"]} har tagits bort`,
        variant: "default",
      });

      await loadPersonnel(); // Reload data
    } catch (err) {
      toast({
        description: "Kunde inte ta bort person",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Personal</h2>
            <p className="text-muted-foreground">
              Hantera föreningens personal och ersättningar
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <RefreshCw
              className={`h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition ${
                loading ? "animate-spin" : ""
              }`}
              onClick={loadPersonnel}
            />

            <Button
              variant="outline"
              className="border-border"
              onClick={handleExcelUploadOpen}
            >
              <Upload className="mr-2 h-4 w-4" />
              Ladda upp fil
            </Button>
            <Button
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={handleAddPerson}
            >
              <Plus className="mr-2 h-4 w-4" />
              Lägg till person
            </Button>
            <FortnoxPushButton className="mr-2" onComplete={handlePushComplete} />
          </div>
        </div>

        {/* Personnel Table */}
        <PersonnelTable
          data={personnel}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEditPerson}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeletePerson}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <FortnoxBatchErrors errors={batchErrors} />

        {/* Personnel Form Dialog */}
        <PersonnelForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingRecord}
          loading={formLoading}
        />

        {/* Excel Upload Modal */}
        <Dialog open={excelUploadOpen} onOpenChange={setExcelUploadOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Ladda upp Personal Excel-fil</DialogTitle>
            </DialogHeader>
            <PersonnelExcelUpload
              onDataUploaded={handleExcelDataUploaded}
              onError={handleExcelError}
            />
          </DialogContent>
        </Dialog>

        {/* Excel Viewer Modal */}
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Granska och redigera Personal Excel-data</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden min-h-0">
              {excelData.length > 0 && (
                <PersonnelExcelViewer
                  data={excelData}
                  personnelList={personnel}
                  onSave={handleExcelSave}
                  onCancel={handleExcelCancel}
                  loading={loading}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}