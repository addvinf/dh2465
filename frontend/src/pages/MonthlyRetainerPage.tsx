import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { fetchMonthlyRetainer } from "../services/monthlyRetainerService";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/table";
import { Header } from "../components/Header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { RefreshCw } from "lucide-react";

export function MontlyRetainerPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [org] = useState("test_förening");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMonthlyRetainer(org);
      setData(result.rows || []);
    } catch (err: any) {
      let message = "Kunde inte hämta månad-data.";
      if (err?.response) {
        message += `\nStatus: ${err.response.status}`;
        if (err.response.data?.error) {
          message += `\nFelmeddelande: ${err.response.data.error}`;
        } else if (typeof err.response.data === "string") {
          message += `\nSvar: ${err.response.data}`;
        }
      } else if (err?.request) {
        message += "\nIngen respons från servern.";
      } else if (err?.message) {
        message += `\n${err.message}`;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")].concat(
      data.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
      )
    );
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manad-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">
              Månad-data
            </h2>
            <p className="text-muted-foreground">
              Hantera och exportera månatlig statistik och rapporter
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card className="financial-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-foreground">
                Månad-data
              </CardTitle>
              <div className="flex items-center space-x-2">
                <RefreshCw
                  className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition"
                  onClick={fetchData}
                />
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={!data.length}
                >
                  Exportera CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Laddar månad-data...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {data[0] &&
                      Object.keys(data[0]).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.keys(row).map((key) => (
                        <TableCell key={key}>{row[key]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
