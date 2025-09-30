import { Button } from "../components/ui/Button";
import {
  fetchPersonnel,
  addPersonnel,
  updatePersonnel,
} from "../services/personnelService";
import { Plus, Upload, RefreshCw } from "lucide-react";
import { Header } from "../components/Header";
import { pushEmployeesBatch } from "../services/fortnoxEmployeesService";
import fortnoxLogo from "../assets/fortnox_logo.png";
import { checkFortnoxAuthStatus, initiateFortnoxLogin } from "../services/fortnoxService";
import { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { ExcelViewer } from "../components/ExcelViewer";
import { toast } from "../hooks/use-toast";
import { PersonnelTable } from "../components/PersonnelTable";
import { PersonnelForm } from "../components/PersonnelForm";
import type { PersonnelRecord } from "../types/personnel";

export function PersonnelSection() {
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<
    PersonnelRecord | undefined
  >();
  const [formLoading, setFormLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [batchErrors, setBatchErrors] = useState<any[]>([]);
  const [checkingFortnox, setCheckingFortnox] = useState(true);
  const [fortnoxAuthorized, setFortnoxAuthorized] = useState<boolean>(false);
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
    refreshFortnoxStatus();
  }, []);

  const refreshFortnoxStatus = async () => {
    try {
      setCheckingFortnox(true);
      const status = await checkFortnoxAuthStatus();
      setFortnoxAuthorized(Boolean(status.authorized));
    } catch (_) {
      setFortnoxAuthorized(false);
    } finally {
      setCheckingFortnox(false);
    }
  };

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

  const handlePushToFortnox = async () => {
    setPushing(true);
    try {
      toast({ description: "Startar export till Fortnox..." });
      const result = await pushEmployeesBatch({ dryRun: false });
      const errors = (result.items || []).filter((i) => i.error);
      setBatchErrors(errors);
      if (result.failures === 0) {
        toast({ description: `Export klar: ${result.successes} st skickade.` });
      } else {
        toast({ description: `Delvis klar: ${result.successes} ok, ${result.failures} fel.`, variant: "destructive" });
      }
      // Refresh table to reflect added_to_fortnox flags
      await loadPersonnel();
    } catch (e: any) {
      toast({ description: e?.message || "Misslyckades att skicka till Fortnox", variant: "destructive" });
    } finally {
      setPushing(false);
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

  // Save from ExcelViewer - would need additional processing to convert to PersonnelRecord[]
  const handleViewerSave = (_rows: any[][]) => {
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
            {/* Fortnox auth: status above button without affecting alignment */}
            <div className="relative mr-2">
              <div className="absolute -top-5 left-0 text-xs text-muted-foreground leading-none">
                {checkingFortnox ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-border border-t-transparent"></span>
                    Kontrollerar Fortnox...
                  </span>
                ) : fortnoxAuthorized ? (
                  <span className="text-green-600 dark:text-green-500">Fortnox är autentiserat</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-destructive">Ej inloggad</span>
                    <button
                      type="button"
                      className="underline text-primary hover:opacity-80"
                      onClick={() => {
                        toast({ title: "Omdirigerar till Fortnox", description: "Slutför autentisering..." });
                        initiateFortnoxLogin();
                      }}
                    >
                      Autentisera nu
                    </button>
                  </span>
                )}
              </div>
              <Button
              className={`text-white ${pushing ? 'opacity-80 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: '#065f46' }}
              onClick={handlePushToFortnox}
              disabled={pushing}
              >
              {pushing ? (
                <span className="flex items-center">
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <img src={fortnoxLogo} alt="Fortnox" className="h-4 w-4 mr-2" />
                  Skickar...
                </span>
              ) : (
                <span className="flex items-center">
                  <img src={fortnoxLogo} alt="Fortnox" className="h-5 w-5 mr-2" />
                  Push to Fortnox
                </span>
              )}
              </Button>
            </div>
          </div>
        </div>

        {/* Personnel Table */}
        <PersonnelTable
          data={personnel}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEditPerson}
        />

        {/* Batch error panel */}
        {batchErrors.length > 0 && (
          <div className="mt-4 p-4 border border-destructive/40 rounded-md bg-destructive/5">
            <h3 className="text-lg font-semibold mb-2">Fel vid export</h3>
            <div className="space-y-2">
              {batchErrors.map((err, idx) => (
                <div key={idx} className="p-3 rounded bg-background border border-border">
                  <div className="text-sm text-muted-foreground">Rad-ID: {err.id}</div>
          
                  {err.details?.ErrorInformation?.message && (
                    <div className="text-sm mt-1 break-words">
                      {err.details.ErrorInformation.message}
                    </div>
                  )}
                  {err.details && !err.details.ErrorInformation && (
                    <pre className="mt-2 text-xs whitespace-pre-wrap break-words">{JSON.stringify(err.details, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
