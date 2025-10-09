import { useState, useEffect } from "react";
import { Download, Upload, Send } from "lucide-react";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "../hooks/use-toast";
import { SimpleCompensationTable } from "../components/compensation/SimpleCompensationTable";
import { SimplePersonView } from "../components/compensation/SimplePersonView";
import { CompensationViewToggle } from "../components/compensation/Features/CompensationViewToggle";
import { CompensationModal } from "../components/compensation/CompensationModal";
import type {
  CompensationRecord,
  CompensationViewMode,
} from "../types/compensation";
import { groupCompensationsByPerson } from "../utils/compensationUtils";
import {
  fetchCompensations,
  addCompensation,
  updateCompensation,
  deleteCompensation,
} from "../services/compensationService";
import { Header } from "../components/Header";

export function LonerPage() {
  const [compensations, setCompensations] = useState<CompensationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] =
    useState<CompensationViewMode>("compensation");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompensation, setEditingCompensation] =
    useState<CompensationRecord | null>(null);
  const [defaultPersonName, setDefaultPersonName] = useState("");

  const generatePeriodOptions = () => {
    const options = [{ value: "all", label: "Alla perioder" }];
    const currentDate = new Date();

    for (let i = -12; i <= 3; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      );
      const monthYear = date.toLocaleDateString("sv-SE", {
        month: "long",
        year: "numeric",
      });
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      options.push({ label: monthYear, value });
    }

    return options;
  };

  const org = "test_förening"; // This should come from context/settings
  const periodOptions = generatePeriodOptions();
  const selectedPeriodData =
    periodOptions.find((p) => p.value === selectedPeriod) || periodOptions[0];

  const loadCompensations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCompensations(org);
      setCompensations(result.data);
    } catch (err) {
      setError("Kunde inte hämta ersättningar från backend");
      console.error("Failed to load compensations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompensations();
  }, []);

  // Filter compensations by selected period
  const filteredCompensations =
    selectedPeriod === "all"
      ? compensations
      : compensations.filter((comp) => comp["Avser Mån/år"] === selectedPeriod);

  // Group compensations by person for person view
  const personCompensations = groupCompensationsByPerson(filteredCompensations);

  const handleAddCompensation = async (
    data: Omit<CompensationRecord, "id">
  ) => {
    try {
      await addCompensation(org, data as any);
      toast({
        description: "Ersättning tillagd",
        variant: "default",
      });
      await loadCompensations();
    } catch (err) {
      toast({
        description: "Kunde inte lägga till ersättning",
        variant: "destructive",
      });
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleEditCompensation = async (compensation: CompensationRecord) => {
    try {
      await updateCompensation(org, compensation.id!, compensation);
      toast({
        description: "Ersättning uppdaterad",
        variant: "default",
      });
      await loadCompensations();
    } catch (err) {
      toast({
        description: "Kunde inte uppdatera ersättning",
        variant: "destructive",
      });
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleDeleteCompensation = async (id: string) => {
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

  // Modal handlers
  const openAddModal = (personName = "") => {
    setEditingCompensation(null);
    setDefaultPersonName(personName);
    setModalOpen(true);
  };

  const openEditModal = (compensation: CompensationRecord) => {
    setEditingCompensation(compensation);
    setDefaultPersonName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCompensation(null);
    setDefaultPersonName("");
  };

  const handleModalSave = async (
    data: CompensationRecord | Omit<CompensationRecord, "id">
  ) => {
    if (editingCompensation) {
      await handleEditCompensation(data as CompensationRecord);
    } else {
      await handleAddCompensation(data as Omit<CompensationRecord, "id">);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Löner</h1>
            <p className="text-muted-foreground">
              Hantera ersättningar och löner för organisationens personal
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importera Excel
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportera Excel
            </Button>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Skicka till Fortnox
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totala ersättningar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("sv-SE", {
                  style: "currency",
                  currency: "SEK",
                }).format(
                  filteredCompensations.reduce(
                    (sum, comp) => sum + (comp["Total ersättning"] || 0),
                    0
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPeriodData.label}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Antal ersättningar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredCompensations.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPeriodData.label}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Antal personer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {personCompensations.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Får ersättning {selectedPeriodData.label}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="financial-card">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Ersättningar
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 mb-6 sm:space-y-0">
            <CompensationViewToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 ">
                <span className="text-sm font-medium">Period:</span>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => openAddModal()}>
                Lägg till ersättning
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">
                Laddar ersättningar...
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
            <SimplePersonView
              personCompensations={personCompensations}
              period={selectedPeriodData}
              onAddCompensation={openAddModal}
              onEditCompensation={openEditModal}
              onDeleteCompensation={handleDeleteCompensation}
            />
          ) : (
            <SimpleCompensationTable
              compensations={filteredCompensations}
              onAdd={handleAddCompensation}
              onEdit={async (id: string, data: Partial<CompensationRecord>) => {
                const fullCompensation: CompensationRecord = {
                  ...filteredCompensations.find((c) => c.id === id)!,
                  ...data,
                  id,
                };
                await handleEditCompensation(fullCompensation);
              }}
              onDelete={handleDeleteCompensation}
              loading={loading}
            />
          )}

          {/* Modal */}
          <CompensationModal
            isOpen={modalOpen}
            onClose={closeModal}
            onSave={handleModalSave}
            compensation={editingCompensation || undefined}
            defaultPersonName={defaultPersonName}
          />
        </Card>
      </div>
    </>
  );
}
