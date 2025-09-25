import { useState } from "react";
// import { Header } from "@/components/Header";
import { ExcelUpload } from "../components/ExcelUpload";
import { ExcelViewer } from "../components/ExcelViewer";

export default function AdminPanel() {
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (
    data: any[][],
    fileHeaders: string[],
    name: string
  ) => {
    setExcelData(data);
    setHeaders(fileHeaders);
    setFileName(name);
    setIsViewerOpen(true);
  };

  const handleSave = (updatedData: any[][]) => {
    setExcelData(updatedData);
    // Here you would typically save to backend
    console.log("Saving data:", updatedData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">
              Hantera Excel-filer för lönedata och personalinformation
            </p>
          </div>

          <ExcelUpload onFileUpload={handleFileUpload} />

          {isViewerOpen && (
            <ExcelViewer
              data={excelData}
              headers={headers}
              fileName={fileName}
              isOpen={isViewerOpen}
              onClose={() => setIsViewerOpen(false)}
              onSave={handleSave}
            />
          )}
        </div>
      </main>
    </div>
  );
}
