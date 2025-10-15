import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { fetchPersonnel } from "../services/personnelService";
import { isExcelFile, parseSheetToAOA } from "../utils/excelUtils";

interface ExcelUploadProps {
  onFileUpload: (data: any[][], headers: string[], fileName: string) => void;
}

export function ExcelUpload({ onFileUpload }: ExcelUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError("");

    if (!isExcelFile(file)) {
      setError("Endast Excel-filer (.xlsx, .xls) är tillåtna");
      return;
    }
    parseSheetToAOA(file, { padRows: true })
      .then(({ headers, rows, rowCount }) => {
        if (!rowCount) {
          setError("Excel-filen verkar vara tom");
          return;
        }
        onFileUpload(rows, headers, file.name);
      })
      .catch(() =>
        setError(
          "Kunde inte läsa Excel-filen. Kontrollera att filen inte är skadad."
        )
      );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleBackendUpload = async () => {
    setError("");
    try {
      const { data } = await fetchPersonnel("test_förening");
      // Convert personnel data to expected format for onFileUpload
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const rows = data.map((item) => Object.values(item));
      onFileUpload(rows, headers, "Backend: test_förening");
    } catch (err: any) {
      setError(err.message || "Kunde inte hämta data från backend");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Ladda upp Excel-fil
          </CardTitle>
          <CardDescription>
            Dra och släpp en Excel-fil eller välj från din dator eller backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary-muted"
                : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              Dra och släpp Excel-fil här
            </p>
            <p className="text-muted-foreground mb-4">
              Eller klicka för att välja en fil
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              Välj fil från dator
            </Button>
            <Button
              variant="secondary"
              onClick={handleBackendUpload}
              className="ml-2"
            >
              Välj från backend
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Expected format info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Förväntad format:</h4>
            {/* make a div that suggest which files that should be accepted:, ie just a list of 3 fil names*/}
            <p> Personal Förening.xlsx (Endast mock)</p>

            <p className="text-xs text-muted-foreground mt-2">
              * Systemet kan hantera andra format också
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
