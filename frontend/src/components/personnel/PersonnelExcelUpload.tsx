import React, { useState, useCallback } from "react";
import { FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/Button";
import { isExcelFile, parseSheetToObjects } from "../../utils/excelUtils";
import type { PersonnelRecord } from "../../types/personnel";

// Expected headers for personnel Excel files
export const EXPECTED_PERSONNEL_HEADERS = [
  "Förnamn",
  "Efternamn", 
  "E-post",
  "Personnummer",
  "Clearingnr",
  "Bankkonto",
  "Adress",
  "Postnr", 
  "Postort",
  "Kostnadsställe",
  "Ändringsdag",
  "Månad",
  "Timme",
  "Heldag",
  "Annan",
  "Kommentar",
  "Befattning",
  "Skattesats",
  "Sociala Avgifter"
];

interface PersonnelExcelUploadProps {
  onDataUploaded: (data: Partial<PersonnelRecord>[]) => void;
  onError: (error: string) => void;
}

function normalizePersonnelRecord(row: any): Partial<PersonnelRecord> {
  return {
    "Förnamn": String(row["Förnamn"] || "").trim(),
    "Efternamn": String(row["Efternamn"] || "").trim(),
    "E-post": String(row["E-post"] || "").trim(),
    "Personnummer": String(row["Personnummer"] || "").trim(),
    "Clearingnr": String(row["Clearingnr"] || "").trim(),
    "Bankkonto": String(row["Bankkonto"] || "").trim(),
    "Adress": String(row["Adress"] || "").trim(),
    "Postnr": String(row["Postnr"] || "").trim(),
    "Postort": String(row["Postort"] || "").trim(),
    "Kostnadsställe": String(row["Kostnadsställe"] || "").trim(),
    "Ändringsdag": String(row["Ändringsdag"] || "").trim(),
    "Månad": String(row["Månad"] || "").trim(),
    "Timme": String(row["Timme"] || "").trim(),
    "Heldag": String(row["Heldag"] || "").trim(),
    "Annan": String(row["Annan"] || "").trim(),
    "Kommentar": String(row["Kommentar"] || "").trim(),
    "Befattning": String(row["Befattning"] || "").trim(),
    "Skattesats": Number(row["Skattesats"]) || 0,
    "Sociala Avgifter": Boolean(row["Sociala Avgifter"]) || false,
    "Upplagd av": String(row["Upplagd av"] || "").trim(),
  };
}

export function PersonnelExcelUpload({
  onDataUploaded,
  onError,
}: PersonnelExcelUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<{
    fileName: string;
    rowCount: number;
    headerRow: number;
  } | null>(null);

  const processExcelFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setUploadInfo(null);

      try {
        const { rows, headerRow } = await parseSheetToObjects(file, {
          expectedHeaders: EXPECTED_PERSONNEL_HEADERS,
          maxScanRows: 5,
        });

        if (rows.length === 0) {
          throw new Error("Inga giltiga datarader hittades");
        }

        // Normalize and clean the data
        const normalizedData = rows.map((row: any) => normalizePersonnelRecord(row));
        const validData = normalizedData.filter((row) =>
          Object.values(row).some((value) => value && String(value).trim())
        );

        if (validData.length === 0) {
          throw new Error("Inga giltiga datarader hittades");
        }

        setUploadInfo({
          fileName: file.name,
          rowCount: validData.length,
          headerRow: headerRow + 1,
        });

        onDataUploaded(validData);
      } catch (error) {
        console.error("Excel processing error:", error);
        onError(
          error instanceof Error ? error.message : "Kunde inte läsa Excel-filen"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onDataUploaded, onError]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!isExcelFile(file)) {
        onError("Endast Excel-filer (.xlsx, .xls) stöds");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        onError("Filen är för stor. Max 10MB tillåts");
        return;
      }

      processExcelFile(file);
    },
    [processExcelFile, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 1) {
        onError("Vänligen ladda upp endast en fil åt gången");
        return;
      }

      if (files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile, onError]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input
      e.target.value = "";
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className="space-y-4">
      <Card
        className={`transition-colors duration-200 cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-dashed border-zinc-600 hover:border-zinc-500"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Bearbetar Excel-fil...</p>
              <p className="text-xs text-muted-foreground mt-2">
                Detta kan ta en stund för stora filer
              </p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Dra och släpp Personal Excel-fil här
              </p>
              <p className="text-muted-foreground mb-4">
                Eller klicka för att välja en fil från din dator
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="personnel-excel-upload"
              />
              <Button
                onClick={() => document.getElementById("personnel-excel-upload")?.click()}
                variant="default"
              >
                Välj Excel-fil
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {uploadInfo && (
        <Card className="border-green-600 bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Fil uppladdad framgångsrikt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Filnamn:</span>
              <span className="text-green-400">{uploadInfo.fileName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Antal rader:</span>
              <span className="text-green-400">{uploadInfo.rowCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Huvudrad:</span>
              <span className="text-green-400">Rad {uploadInfo.headerRow}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-amber-600 bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            Filformat-krav
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Förväntade kolumner:</p>
            <ul className="text-xs text-muted-foreground space-y-1 grid grid-cols-2 gap-x-4">
              <li>• Förnamn</li>
              <li>• Efternamn</li>
              <li>• E-post</li>
              <li>• Personnummer</li>
              <li>• Clearingnr</li>
              <li>• Bankkonto</li>
              <li>• Adress</li>
              <li>• Postnr</li>
              <li>• Postort</li>
              <li>• Kostnadsställe</li>
              <li>• Ändringsdag</li>
              <li>• Månad</li>
              <li>• Timme</li>
              <li>• Heldag</li>
              <li>• Annan</li>
              <li>• Kommentar</li>
              <li>• Befattning</li>
              <li>• Skattesats</li>
              <li>• Sociala Avgifter</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Kolumnnamnen behöver inte vara exakt som listade ovan</p>
            <p>• Systemet kan hantera variationer i stavning och formatering</p>
            <p>• Endast Excel-filer (.xlsx, .xls) stöds</p>
            <p>• Maximal filstorlek: 10MB</p>
            <p>• E-post är obligatorisk för varje person</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}