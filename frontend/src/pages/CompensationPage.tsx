import { useEffect, useState, useRef } from "react";
import { RefreshCw, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";

import {
  fetchCompensations,
  deleteCompensation,
} from "../services/compensationService";
import { Button } from "../components/ui/Button";
import { Header } from "../components/Header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "../hooks/use-toast";

import { PersonCompensationCard } from "../components/compensation/PersonCompensationCard";
import { CompensationTable } from "../components/compensation/CompensationTable";
import { CompensationViewToggle } from "../components/compensation/CompensationViewToggle";
import { FortnoxPushButton } from "../components/FortnoxPushButton";

import type {
  CompensationRecord,
  CompensationViewMode,
} from "../types/compensation";
import {
  groupCompensationsByPerson,
  generatePeriodOptions,
  formatPeriodValue,
  getCurrentPeriod,
} from "../utils/compensationUtils";

export function LonerPage() {
  const [compensations, setCompensations] = useState<CompensationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CompensationViewMode>("person");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [org] = useState("test_förening");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const periods = generatePeriodOptions();
  const currentPeriod = getCurrentPeriod();

  // Initialize with current period
  useEffect(() => {
    setSelectedPeriod(formatPeriodValue(currentPeriod));
  }, []);

  const loadCompensations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCompensations(org);
      setCompensations(result.data);
    } catch (err: any) {
      setError(err?.message || "Kunde inte ladda ersättningsdata");
      toast({
        description: "Kunde inte ladda ersättningsdata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompensations();
  }, [org]);

  const handleAddCompensation = async (
    initialData?: Partial<CompensationRecord>
  ) => {
    // For now, we'll handle this with the inline table row addition
    // This could be extended to open a modal form in the future
    console.log("Add compensation with initial data:", initialData);
  };

  const handleEditCompensation = async (compensation: CompensationRecord) => {
    // Placeholder for edit functionality
    // This could open a modal form or inline editing
    console.log("Edit compensation:", compensation);
  };

  const handleDeleteCompensation = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna ersättning?")) {
      return;
    }

    try {
      await deleteCompensation(org, id);
      toast({
        description: "Ersättning borttagen",
        variant: "default",
      });
      await loadCompensations();
    } catch (err) {
      toast({
        description: "Kunde inte ta bort ersättning",
        variant: "destructive",
      });
    }
  };

  const handleFortnoxPushComplete = async (result: {
    failures: number;
    successes: number;
    items: any[];
  }) => {
    const errors = (result.items || []).filter((i) => i.error);
    if (errors.length > 0) {
      console.log("Fortnox push errors:", errors);
    }
    await loadCompensations(); // Reload to get updated Fortnox statuses
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log("Excel data loaded:", jsonData);

        toast({
          description: `Excel-fil laddad: ${jsonData.length} rader`,
          variant: "default",
        });

        // TODO: Implement Excel data validation and import
        // For now, just log the data
      } catch (error) {
        toast({
          description: "Kunde inte läsa Excel-filen",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    if (!compensations.length) return;

    const headers = [
      "Upplagd av",
      "Avser Mån/år",
      "Ledare",
      "Kostnadsställe",
      "Aktivitetstyp",
      "Antal",
      "Ersättning",
      "Total ersättning",
      "Datum utbet",
      "Fortnox status",
      "Eventuell kommentar",
    ];

    const csvRows = [headers.join(",")].concat(
      compensations.map((comp) =>
        headers
          .map((h) => JSON.stringify(comp[h as keyof CompensationRecord] ?? ""))
          .join(",")
      )
    );

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loner_${
      selectedPeriod === "all" ? "alla" : selectedPeriod
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group compensations by person for person view
  const personCompensations = groupCompensationsByPerson(
    compensations,
    viewMode === "person" && selectedPeriod !== "all"
      ? selectedPeriod
      : undefined
  );

  // Filter compensations for table view
  const filteredCompensations =
    selectedPeriod && selectedPeriod !== "all" && viewMode === "compensation"
      ? compensations.filter((comp) => comp["Avser Mån/år"] === selectedPeriod)
      : compensations;

  const selectedPeriodData =
    periods.find((p) => formatPeriodValue(p) === selectedPeriod) ||
    currentPeriod;

  return (
    <>
      <Header />
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Löner</h2>
            <p className="text-muted-foreground">
              Hantera ersättningar och lönutbetalningar
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <FortnoxPushButton
              onComplete={handleFortnoxPushComplete}
              className="relative"
            />
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kontroller</CardTitle>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Ladda upp Excel</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!compensations.length}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportera CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCompensations}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span>Uppdatera</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CompensationViewToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-foreground">
                    Period:
                  </label>
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Välj period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla perioder</SelectItem>
                      {periods.map((period) => (
                        <SelectItem
                          key={formatPeriodValue(period)}
                          value={formatPeriodValue(period)}
                        >
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {viewMode === "person"
                  ? `${personCompensations.length} personer`
                  : `${filteredCompensations.length} ersättningar`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Content Area */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">
                Laddar ersättningsdata...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadCompensations} variant="outline">
                Försök igen
              </Button>
            </div>
          ) : viewMode === "person" ? (
            <div className="space-y-4">
              {personCompensations.length > 0 ? (
                personCompensations.map((personComp) => (
                  <PersonCompensationCard
                    key={personComp.personnelName}
                    personCompensation={personComp}
                    period={selectedPeriodData}
                    onEditCompensation={handleEditCompensation}
                    onDeleteCompensation={handleDeleteCompensation}
                    onAddCompensation={(name) =>
                      handleAddCompensation({
                        Ledare: name,
                        "Avser Mån/år":
                          selectedPeriod !== "all"
                            ? selectedPeriod
                            : formatPeriodValue(currentPeriod),
                      })
                    }
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      Inga ersättningar för {selectedPeriodData.label}
                    </p>
                    <Button
                      onClick={() =>
                        handleAddCompensation({
                          "Avser Mån/år":
                            selectedPeriod !== "all"
                              ? selectedPeriod
                              : formatPeriodValue(currentPeriod),
                        })
                      }
                      variant="outline"
                    >
                      Lägg till första ersättning
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent>
                <CompensationTable
                  compensations={filteredCompensations}
                  onEdit={handleEditCompensation}
                  onDelete={handleDeleteCompensation}
                  onAddNew={() =>
                    handleAddCompensation({
                      "Avser Mån/år":
                        selectedPeriod !== "all"
                          ? selectedPeriod
                          : formatPeriodValue(currentPeriod),
                    })
                  }
                  loading={loading}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
