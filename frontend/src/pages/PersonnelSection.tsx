import { Button } from "../components/ui/Button";
import {
  fetchPersonnel,
  addPersonnel,
  updatePersonnel,
  togglePersonnelStatus,
} from "../services/personnelService";
import { Plus, Upload, RefreshCw } from "lucide-react";
import { Header } from "../components/Header";
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
      if (jsonData.length > 1) {
        setViewerData(jsonData.slice(1) as any[][]);
        setViewerHeaders(jsonData[0] as string[]);
        setViewerFileName(file.name);
        setViewerOpen(true);
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

  // Save from ExcelViewer - would need additional processing to convert to PersonnelRecord[]
  const handleViewerSave = (_data: any[][]) => {
    // This would need proper conversion from array format to PersonnelRecord format
    toast({
      description: "Excel import inte helt implementerad än",
      variant: "destructive",
    });
    setViewerOpen(false);
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
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

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
            onClose={() => setViewerOpen(false)}
            onSave={handleViewerSave}
          />
        )}
      </div>
    </>
  );
}
