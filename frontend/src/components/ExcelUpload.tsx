import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import * as XLSX from "xlsx";

interface ExcelUploadProps {
  onFileUpload: (data: any[][], headers: string[], fileName: string) => void;
}

export function ExcelUpload({ onFileUpload }: ExcelUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedColumns = [
    "Upplagd av",
    "Personnummer",
    "Förnamn",
    "Efternamn",
    "Clearingnr",
    "Bankkonto",
    "Adress",
    "Postnr",
    "Postort",
    "E-post",
    "Kostnadsställe",
    "Ändringsdag",
    "Månad",
    "Timme",
    "Heldag",
    "Annan",
    "Kommentar",
  ];

  const handleFile = (file: File) => {
    setError("");

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError("Endast Excel-filer (.xlsx, .xls) är tillåtna");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          setError("Excel-filen verkar vara tom");
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        onFileUpload(rows, headers, file.name);
      } catch (err) {
        setError(
          "Kunde inte läsa Excel-filen. Kontrollera att filen inte är skadad."
        );
      }
    };
    reader.readAsArrayBuffer(file);
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

  const handleBackendUpload = () => {
    // Placeholder for backend file selection
    setError("");
    // This would typically open a file browser for backend files
    alert("Backend filhantering kommer att implementeras");
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              {expectedColumns.map((col) => (
                <div key={col} className="bg-background px-2 py-1 rounded">
                  {col}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Systemet kan hantera andra format också
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
