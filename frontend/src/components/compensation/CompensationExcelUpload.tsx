import React, { useCallback, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { isExcelFile, parseSheetToObjects } from "../../utils/excelUtils";
import type { CompensationRecord } from "../../types/compensation";
import {
  EXPECTED_HEADERS,
  normalizeCompensationRecord,
} from "../../utils/compensationValidation";

interface CompensationExcelUploadProps {
  onDataUploaded: (data: Partial<CompensationRecord>[]) => void;
  onError: (error: string) => void;
}

export function CompensationExcelUpload({
  onDataUploaded,
  onError,
}: CompensationExcelUploadProps) {
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
          expectedHeaders: EXPECTED_HEADERS,
          maxScanRows: 5,
        });

        if (rows.length === 0) {
          throw new Error("Inga giltiga datarader hittades");
        }

        // Normalize and clean the data
        const normalizedData = rows.map((row: any) => normalizeCompensationRecord(row));
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
              <p className="text-lg font-medium">Bearbetar Excel-fil...</p>
              <p className="text-sm text-muted-foreground">
                Detta kan ta en stund för stora filer
              </p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ladda upp Excel-fil</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Dra och släpp din Excel-fil här eller klicka för att välja
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button asChild variant="outline">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Välj fil
                  </span>
                </Button>
              </label>
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
              <span className="font-medium">{uploadInfo.fileName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Datarader:</span>
              <Badge variant="secondary">{uploadInfo.rowCount}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rubrikrad:</span>
              <Badge variant="outline">Rad {uploadInfo.headerRow}</Badge>
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
            <div className="grid grid-cols-2 gap-1 text-xs">
              {EXPECTED_HEADERS.map((header) => (
                <Badge
                  key={header}
                  variant="outline"
                  className="text-xs justify-start"
                >
                  {header}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Excel-filer (.xlsx, .xls) stöds</p>
            <p>• Första arket används automatiskt</p>
            <p>
              • Rubrikraden detekteras automatiskt (inom de första 5 raderna)
            </p>
            <p>• Tomma rader filtreras bort automatiskt</p>
            <p>• Max filstorlek: 10MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
