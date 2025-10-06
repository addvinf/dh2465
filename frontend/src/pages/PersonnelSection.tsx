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
// Fortnox auth status handled by FortnoxPushButton
import { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { ExcelViewer } from "../components/ExcelViewer";
import { toast } from "../hooks/use-toast";
import { PersonnelTable } from "../components/PersonnelTable";
import { PersonnelForm } from "../components/PersonnelForm";
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
  // Fortnox auth status now handled inside FortnoxPushButton
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewerData, setViewerData] = useState<any[][]>([]);
  const [viewerHeaders, setViewerHeaders] = useState<string[]>([]);
  const [viewerFileName, setViewerFileName] = useState<string>("");

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
        toast({ description: "Personen har uppdaterats!", variant: "default" });
      } else {
        await addPersonnel("test_förening", data);
        toast({ description: "Personen har lagts till!", variant: "default" });
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

  // Handle Excel viewer close and reset file input
  const handleViewerClose = () => {
    setViewerOpen(false);
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle file upload and parse
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length > 2) {
        // Look for the actual header row by checking for expected column names
        let headerRowIndex = 0;
        let dataStartIndex = 1;

        // Check if first row contains headers or just labels
        const firstRow = jsonData[0] as string[];

        // If first row doesn't contain our expected headers, use second row
        if (
          firstRow &&
          firstRow.some(
            (cell) =>
              cell?.includes("Tränarersättning") || !cell?.includes("Förnamn")
          )
        ) {
          headerRowIndex = 1;
          dataStartIndex = 2;
        }

        const headers = jsonData[headerRowIndex] as string[];
        const dataRows = jsonData.slice(dataStartIndex) as any[][];

        if (headers && dataRows.length > 0) {
          setViewerHeaders(headers);
          setViewerData(dataRows);
          setViewerFileName(file.name);
          setViewerOpen(true);
        } else {
          toast({
            description: "Ingen giltig data hittades i filen",
            variant: "destructive",
          });
        }
      } else {
        toast({
          description: "Filen innehåller inte tillräckligt med data",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
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

  // Save from ExcelViewer - convert Excel data to PersonnelRecord format and handle add/update
  const handleViewerSave = async (data: any[][]) => {
    if (!data.length || !viewerHeaders.length) {
      toast({
        description: "Ingen data att spara",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert Excel data to PersonnelRecord format
      const personnelRecords: Partial<PersonnelRecord>[] = data.map((row) => {
        const record: Partial<PersonnelRecord> = {};

        viewerHeaders.forEach((header, index) => {
          const value = row[index];

          // Map CSV headers to PersonnelRecord keys and handle type conversion
          switch (header) {
            case "Upplagd av":
              record["Upplagd av"] = String(value || "Admin");
              break;
            case "Personnummer":
              record["Personnummer"] = String(value || "");
              break;
            case "Förnamn":
              record["Förnamn"] = String(value || "");
              break;
            case "Efternamn":
              record["Efternamn"] = String(value || "");
              break;
            case "Clearingnr":
              record["Clearingnr"] = String(value || "");
              break;
            case "Bankkonto":
              record["Bankkonto"] = String(value || "");
              break;
            case "Adress":
              record["Adress"] = String(value || "");
              break;
            case "Postnr":
              record["Postnr"] = String(value || "");
              break;
            case "Postort":
              record["Postort"] = String(value || "");
              break;
            case "E-post":
              record["E-post"] = String(value || "");
              break;
            case "Kostnadsställe":
              record["Kostnadsställe"] = String(value || "");
              break;
            case "Ändringsdag":
              record["Ändringsdag"] = value
                ? String(value)
                : new Date().toISOString().split("T")[0];
              break;
            case "Månad":
              record["Månad"] = String(parseFloat(value) || 0);
              break;
            case "Timme":
              record["Timme"] = String(parseFloat(value) || 0);
              break;
            case "Heldag":
              record["Heldag"] = String(parseFloat(value) || 0);
              break;
            case "Annan":
              record["Annan"] = String(value || "");
              break;
            case "Kommentar":
              record["Kommentar"] = String(value || "");
              break;
          }
        });

        // Set default values for required fields
        record.Aktiv = true; // New persons are always active
        record.Befattning = record.Befattning || "";
        record["Skattesats"] = record["Skattesats"] || 30;
        record["Sociala Avgifter"] =
          record["Sociala Avgifter"] !== undefined
            ? record["Sociala Avgifter"]
            : true;
        record.added_to_fortnox = false;
        record.fortnox_employee_id = "";

        return record;
      });

      // Filter out records without email (required field)
      const validRecords = personnelRecords.filter(
        (record) => record["E-post"]
      );

      if (validRecords.length === 0) {
        toast({
          description: "Inga giltiga poster hittades (E-post krävs)",
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
          // Find existing person and merge data, preserving fields not in Excel
          const existingPerson = personnel.find(
            (p) => p["E-post"] === record["E-post"]
          );
          if (existingPerson) {
            // Create merged record that preserves existing fields not in Excel
            const mergedRecord: Partial<PersonnelRecord> = {
              ...existingPerson,
            };

            // Only update fields that are present in the Excel headers
            viewerHeaders.forEach((header) => {
              if (record[header as keyof PersonnelRecord] !== undefined) {
                (mergedRecord as any)[header] =
                  record[header as keyof PersonnelRecord];
              }
            });

            mergedRecord.id = existingPerson.id;
            recordsToUpdate.push(mergedRecord);
          }
        } else {
          recordsToAdd.push(record);
        }
      });

      // Process additions and updates
      let addedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      // Add new records
      for (const record of recordsToAdd) {
        try {
          await addPersonnel("test_förening", record);
          addedCount++;
        } catch (err) {
          errors.push(
            `Kunde inte lägga till ${record["Förnamn"]} ${record["Efternamn"]}: ${err}`
          );
        }
      }

      // Update existing records
      for (const record of recordsToUpdate) {
        try {
          if (record.id) {
            await updatePersonnel("test_förening", record.id, record);
            updatedCount++;
          }
        } catch (err) {
          errors.push(
            `Kunde inte uppdatera ${record["Förnamn"]} ${record["Efternamn"]}: ${err}`
          );
        }
      }

      // Show results
      let message = "";
      if (addedCount > 0) message += `${addedCount} personer tillagda. `;
      if (updatedCount > 0) message += `${updatedCount} personer uppdaterade. `;
      if (errors.length > 0) message += `${errors.length} fel uppstod.`;

      toast({
        description: message || "Inga ändringar gjordes",
        variant: errors.length > 0 ? "destructive" : "default",
      });

      // Reload data and close viewer
      await loadPersonnel();
      handleViewerClose();
    } catch (err) {
      toast({
        description: "Fel vid bearbetning av Excel-data",
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
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileInput}
            />

            <RefreshCw
              className={`h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition ${
                loading ? "animate-spin" : ""
              }`}
              onClick={loadPersonnel}
            />

            <Button
              variant="outline"
              className="border-border"
              onClick={() => fileInputRef.current?.click()}
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

        {/* ExcelViewer Dialog */}
        {viewerOpen && (
          <ExcelViewer
            data={viewerData}
            headers={viewerHeaders}
            fileName={viewerFileName}
            isOpen={viewerOpen}
            onClose={handleViewerClose}
            onSave={handleViewerSave}
          />
        )}
      </div>
    </>
  );
}
