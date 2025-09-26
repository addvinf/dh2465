import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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

// Mock data
const mockPersonnel = [
  {
    id: 1,
    name: "Erik Johansson",
    personnummer: "19901215-****",
    email: "erik.johansson@email.com",
    position: "Tränare Senior",
    salaryType: "Tim",
    hourlyRate: "450 kr",
    status: "Aktiv",
    lastPayment: "2025-01-15",
  },
  {
    id: 2,
    name: "Maria Andersson",
    personnummer: "19850422-****",
    email: "maria.andersson@email.com",
    position: "Domare",
    salaryType: "Match",
    hourlyRate: "800 kr",
    status: "Aktiv",
    lastPayment: "2025-01-15",
  },
  {
    id: 3,
    name: "Johan Berg",
    personnummer: "19920308-****",
    email: "johan.berg@email.com",
    position: "Administratör",
    salaryType: "Månad",
    hourlyRate: "25 000 kr",
    status: "Aktiv",
    lastPayment: "2025-01-01",
  },
  {
    id: 4,
    name: "Sofia Lindén",
    personnummer: "19881120-****",
    email: "sofia.linden@email.com",
    position: "Café",
    salaryType: "Tim",
    hourlyRate: "165 kr",
    status: "Inaktiv",
    lastPayment: "2024-12-15",
  },
];

export function PersonnelSection() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPersonnel = mockPersonnel.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">Personal</h2>
          <p className="text-muted-foreground">
            Hantera föreningens personal och ersättningar
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-border">
            <Upload className="mr-2 h-4 w-4" />
            Synka från Google Sheets
          </Button>
          <Button className="bg-gradient-primary text-primary-foreground shadow-financial">
            <Plus className="mr-2 h-4 w-4" />
            Lägg till person
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

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
              <Button variant="outline" size="sm">
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
                <TableHead>Namn</TableHead>
                <TableHead>Personnummer</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Befattning</TableHead>
                <TableHead>Lönetyp</TableHead>
                <TableHead>Ersättning</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Senaste utbetalning</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel.map((person) => (
                <TableRow key={person.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.personnummer}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.email}
                  </TableCell>
                  <TableCell>{person.position}</TableCell>
                  <TableCell>{person.salaryType}</TableCell>
                  <TableCell className="font-medium">
                    {person.hourlyRate}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        person.status === "Aktiv" ? "default" : "secondary"
                      }
                      className={
                        person.status === "Aktiv"
                          ? "bg-success text-success-foreground"
                          : ""
                      }
                    >
                      {person.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.lastPayment}
                  </TableCell>
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
                        <DropdownMenuItem>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Redigera
                        </DropdownMenuItem>
                        <DropdownMenuItem>Visa lönehistorik</DropdownMenuItem>
                        <DropdownMenuItem>
                          {person.status === "Aktiv"
                            ? "Inaktivera"
                            : "Aktivera"}
                        </DropdownMenuItem>
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
  );
}
