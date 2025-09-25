import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Save, Download, Edit3, Check, X } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import * as XLSX from "xlsx";

interface ExcelViewerProps {
  data: any[][];
  headers: string[];
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any[][]) => void;
}

export function ExcelViewer({
  data,
  headers,
  fileName,
  isOpen,
  onClose,
  onSave,
}: ExcelViewerProps) {
  const [editableData, setEditableData] = useState<any[][]>([]);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setEditableData([...data]);
  }, [data]);

  const handleCellEdit = (rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(String(editableData[rowIndex][colIndex] || ""));
  };

  const handleSaveCell = () => {
    if (editingCell) {
      const newData = [...editableData];
      newData[editingCell.row][editingCell.col] = editValue;
      setEditableData(newData);
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleSaveAll = () => {
    onSave(editableData);
    toast({
      title: "Data sparad",
      description: "Excel-data har sparats framgångsrikt",
    });
  };

  const handleDownload = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...editableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `redigerad_${fileName}`);

    toast({
      title: "Fil nedladdad",
      description: "Excel-filen har laddats ner med dina ändringar",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Excel-fil: {fileName}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{editableData.length} rader</Badge>
              <Badge variant="secondary">{headers.length} kolumner</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Klicka på en cell för att redigera. Använd knapparna nedan för att
            spara ändringar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button onClick={handleSaveAll} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Spara ändringar
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Ladda ner
            </Button>
          </div>
          <Button variant="outline" onClick={onClose}>
            Stäng
          </Button>
        </div>

        <ScrollArea className="h-[60vh] w-full border rounded-lg overflow-auto">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 sticky left-0 bg-background z-10">
                    #
                  </TableHead>
                  {headers.map((header, index) => (
                    <TableHead
                      key={index}
                      className="min-w-[150px] whitespace-nowrap"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="font-medium text-muted-foreground sticky left-0 bg-background z-10">
                      {rowIndex + 1}
                    </TableCell>
                    {headers.map((_, colIndex) => (
                      <TableCell key={colIndex} className="min-w-[150px]">
                        {editingCell?.row === rowIndex &&
                        editingCell?.col === colIndex ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 min-w-[120px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveCell();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveCell}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-accent p-1 rounded group flex items-center justify-between min-w-[120px]"
                            onClick={() => handleCellEdit(rowIndex, colIndex)}
                          >
                            <span className="truncate">
                              {row[colIndex] || ""}
                            </span>
                            <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
