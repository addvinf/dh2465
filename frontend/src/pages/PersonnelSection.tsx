import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit3,
  MoreHorizontal,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Header } from "../components/Header";
import { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { ExcelViewer } from "../components/ExcelViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export function PersonnelSection() {
  const [personnel, setPersonnel] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewerData, setViewerData] = useState<any[][]>([]);
  const [viewerHeaders, setViewerHeaders] = useState<string[]>([]);
  const [viewerFileName, setViewerFileName] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPerson, setNewPerson] = useState<string[]>([]);

  useEffect(() => {
    // Initial fetch for default Excel file
    fetch("/src/assets/Personal Förening Mock (1).xlsx")
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length > 1) {
          setHeaders(jsonData[0] as string[]);
          setPersonnel(jsonData.slice(1) as any[][]);
        }
      });
  }, []);

  const handleAddPerson = () => {
    setPersonnel((prev) => [...prev, newPerson]);
    setAddDialogOpen(false);
    setNewPerson(Array(headers.length).fill("")); // Reset form
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

  // Save from ExcelViewer
  const handleViewerSave = (data: any[][]) => {
    setPersonnel(data);
    setHeaders(viewerHeaders);
    setViewerOpen(false);
  };

  const handleExport = () => {
    if (!headers.length || !personnel.length) return;

    // Create worksheet with headers + data
    const ws = XLSX.utils.aoa_to_sheet([headers, ...personnel]);

    // Create workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personal");

    // Export to file
    XLSX.writeFile(wb, fileName || "Personal.xlsx");
  };

  const filteredPersonnel = personnel.filter((row) => {
    // Adjust indexes based on your Excel columns
    const name = String(row[2] || "").toLowerCase(); // Förnamn
    const position = String(row[6] || "").toLowerCase(); // Befattning
    const email = String(row[9] || "").toLowerCase(); // E-post
    return (
      name.includes(searchTerm.toLowerCase()) ||
      position.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase())
    );
  });

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
          <div className="flex space-x-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileInput}
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
              className="bg-secondary text-secondary-foreground hover:bg-secondary-muted hover:text-secondary-foreground "
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Lägg till person
            </Button>
          </div>
        </div>

        {/* Add Person Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Lägg till person</DialogTitle>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto pr-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddPerson();
                }}
                className="space-y-3"
              >
                {headers.map((header, idx) => (
                  <div key={header} className="flex flex-col">
                    <label className="text-sm text-muted-foreground mb-1">
                      {header}
                    </label>
                    <Input
                      value={newPerson[idx] || ""}
                      onChange={(e) => {
                        const updated = [...newPerson];
                        updated[idx] = e.target.value;
                        setNewPerson(updated);
                      }}
                    />
                  </div>
                ))}
              </form>
            </div>

            {/* Sticky footer */}
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddPerson();
                }}
              >
                Lägg till
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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

        {/* ExcelViewer Dialog for editing current personnel data */}
        {/* {viewerOpen && (
          <ExcelViewer
            data={personnel}
            headers={headers}
            fileName={fileName || "Personal.xlsx"}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            onSave={handleViewerSave}
          />
        )} */}

        {/* Summary Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="financial-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Aktiva</p>
                  <p className="text-xl font-semibold text-foreground">124</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Inaktiva</p>
                  <p className="text-xl font-semibold text-foreground">23</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">Idrottsutövare</p>
                <p className="text-xl font-semibold text-foreground">89</p>
                <p className="text-xs text-muted-foreground">
                  Tränare, domare, lagledare
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">Övrig personal</p>
                <p className="text-xl font-semibold text-foreground">35</p>
                <p className="text-xs text-muted-foreground">
                  Admin, café, sociala medier
                </p>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Personnel Table */}
        <Card className="financial-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-foreground">
                Personalregister
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Sök personal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewerData(personnel);
                    setViewerHeaders(headers);
                    setViewerFileName(fileName || "Personal.xlsx");
                    setViewerOpen(true);
                  }}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Redigera
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportera
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, idx) => (
                    <TableHead key={idx}>{header}</TableHead>
                  ))}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonnel.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-accent/50">
                    {row.map((cell: any, cidx: number) => (
                      <TableCell key={cidx}>{cell}</TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card border-border"
                        >
                          <DropdownMenuItem>Visa lönehistorik</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
