import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Trash2, Plus, Calendar, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data
const mockBackups = [
  {
    id: "1",
    name: "backup-2025-01-15-daily",
    date: "2025-01-15T10:30:00",
    size: "45 MB",
    type: "automatic"
  },
  {
    id: "2",
    name: "backup-2025-01-14-daily",
    date: "2025-01-14T10:30:00",
    size: "44 MB",
    type: "automatic"
  },
  {
    id: "3",
    name: "backup-manual-2025-01-13",
    date: "2025-01-13T15:45:00",
    size: "46 MB",
    type: "manual"
  }
];

export default function Dashboard() {
  const [backups] = useState(mockBackups);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Gerir os seus backups do Home Assistant</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                Armazenamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">135 MB</div>
              <p className="text-sm text-muted-foreground">de 100 MB usados</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Último Backup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">Hoje</div>
              <p className="text-sm text-muted-foreground">às 10:30</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Plano Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">Free</div>
              <Button variant="link" className="p-0 h-auto text-sm">
                Fazer upgrade
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Os Seus Backups</CardTitle>
                <CardDescription>Criar, gerir e restaurar backups</CardDescription>
              </div>
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Backup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backups.map((backup) => (
                <div 
                  key={backup.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{backup.name}</h3>
                      <Badge variant={backup.type === "automatic" ? "default" : "secondary"}>
                        {backup.type === "automatic" ? "Automático" : "Manual"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(backup.date)} • {backup.size}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Restaurar
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
