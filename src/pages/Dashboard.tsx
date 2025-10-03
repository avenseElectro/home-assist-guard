import { useState, useEffect } from "react";
import { DashboardNavbar as Navbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Calendar, HardDrive, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Backup {
  id: string;
  filename: string;
  created_at: string;
  size_bytes: number;
  status: string;
  ha_version: string | null;
}

interface Subscription {
  plan: string;
  max_backups: number;
  max_storage_gb: number;
  retention_days: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: backupsData, error: backupsError } = await supabase
        .from("backups")
        .select("*")
        .eq("user_id", user!.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (backupsError) throw backupsError;
      setBackups(backupsData || []);

      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (subError) throw subError;
      setSubscription(subData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm("Tem certeza que deseja eliminar este backup?")) return;

    try {
      toast.loading("A eliminar backup...");
      
      const { data, error } = await supabase.functions.invoke(
        `backup-delete/${backupId}`,
        {
          method: "DELETE"
        }
      );

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      toast.dismiss();
      toast.success("Backup eliminado com sucesso");
      await fetchData();
    } catch (error) {
      toast.dismiss();
      console.error("Error deleting backup:", error);
      toast.error("Erro ao eliminar backup. Tente novamente.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-subtle">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>A carregar...</p>
        </div>
      </div>
    );
  }

  const storageUsed = backups.reduce((acc, b) => acc + b.size_bytes, 0) / (1024 * 1024 * 1024);
  const storageLimit = subscription?.max_storage_gb || 1;

  return (
    <div className="min-h-screen gradient-subtle">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Gerir os seus backups do Home Assistant</p>
          </div>
          <Link to="/api-keys">
            <Button variant="outline" className="gap-2">
              <Key className="w-4 h-4" />
              Gerir API Keys
            </Button>
          </Link>
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
              <div className="text-3xl font-bold mb-1">{storageUsed.toFixed(2)} GB</div>
              <p className="text-sm text-muted-foreground">de {storageLimit} GB</p>
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
              {backups.length > 0 ? (
                <>
                  <div className="text-3xl font-bold mb-1">
                    {new Date(backups[0].created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    às {new Date(backups[0].created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-1">Sem backups</div>
                  <p className="text-sm text-muted-foreground">-</p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Plano Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 capitalize">{subscription?.plan || "Free"}</div>
              <p className="text-sm text-muted-foreground">
                {backups.length} de {subscription?.max_backups || 3} backups
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-card">
          <CardHeader>
            <div>
              <CardTitle>Os Seus Backups</CardTitle>
              <CardDescription>Ver e gerir backups</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Ainda não tem backups. Configure o HomeSafe Connector no seu Home Assistant para começar.
              </p>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div 
                    key={backup.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{backup.filename}</h3>
                        <Badge variant={backup.status === "completed" ? "default" : "secondary"}>
                          {backup.status === "completed" ? "Completo" : backup.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(backup.created_at)} • {formatSize(backup.size_bytes)}
                        {backup.ha_version && ` • HA ${backup.ha_version}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(backup.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
