import { useState, useEffect } from "react";
import { DashboardNavbar as Navbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Calendar, HardDrive, Key, Download, Zap, Webhook, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BackupTimeline } from "@/components/BackupTimeline";
import { AlertsPanel, getAlertCount } from "@/components/AlertsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Backup {
  id: string;
  filename: string;
  created_at: string;
  size_bytes: number;
  status: string;
  ha_version: string | null;
  backup_trigger?: string;
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
  const [webhooksCount, setWebhooksCount] = useState({ active: 0, total: 0 });

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

      // Fetch webhooks count
      const { data: webhooksData, error: webhooksError } = await supabase
        .from("webhook_configs" as any)
        .select("id, enabled")
        .eq("user_id", user!.id);

      if (!webhooksError && webhooksData) {
        setWebhooksCount({
          active: webhooksData.filter((w: any) => w.enabled).length,
          total: webhooksData.length
        });
      }
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

  const handleDownload = async (backupId: string, filename: string) => {
    try {
      toast.loading("A preparar download...");
      
      const { data, error } = await supabase.functions.invoke(
        'backup-download',
        {
          body: { backupId }
        }
      );

      toast.dismiss();

      if (error) {
        console.error("Download error:", error);
        throw error;
      }

      if (data.download_url) {
        window.open(data.download_url, '_blank');
        toast.success("Download iniciado!");
      } else {
        throw new Error("No download URL returned");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error downloading backup:", error);
      toast.error("Erro ao fazer download. Tente novamente.");
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm("Tem certeza que deseja eliminar este backup?")) return;

    try {
      toast.loading("A eliminar backup...");
      
      const { data, error } = await supabase.functions.invoke(
        'backup-delete',
        {
          body: { backupId }
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
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const storageUsed = backups.reduce((acc, b) => acc + b.size_bytes, 0) / (1024 * 1024 * 1024);
  const storageLimit = subscription?.max_storage_gb || 1;
  const alertCount = getAlertCount(backups, subscription, storageUsed);

  // Calculate stats
  const successRate = backups.length > 0 
    ? ((backups.filter(b => b.status === 'completed').length / backups.length) * 100).toFixed(0)
    : 0;
  const avgSize = backups.length > 0
    ? (backups.reduce((acc, b) => acc + b.size_bytes, 0) / backups.length / (1024 * 1024)).toFixed(0)
    : 0;
  const avgGrowth = backups.length > 1
    ? (backups.slice(0, -1).reduce((acc, backup, index) => {
        const nextBackup = backups[index + 1];
        if (nextBackup) {
          return acc + (backup.size_bytes - nextBackup.size_bytes);
        }
        return acc;
      }, 0) / (backups.length - 1) / (1024 * 1024)).toFixed(0)
    : 0;

  // Generate alerts for navbar dropdown
  const alerts = [];
  if (backups.length > 0) {
    const hoursSinceLastBackup = (Date.now() - new Date(backups[0].created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastBackup > 48) {
      alerts.push({ id: 'no-backup-48h', type: 'warning' as const, title: '⚠️ Sem backups há mais de 48h', icon: <AlertTriangle className="h-4 w-4 text-destructive" /> });
    }
  }
  const storagePercentage = (storageUsed / storageLimit) * 100;
  if (storagePercentage > 80) {
    alerts.push({ id: 'storage-full', type: 'error' as const, title: '📈 Storage quase cheio', icon: <AlertTriangle className="h-4 w-4 text-destructive" /> });
  }
  if (backups.length > 0 && backups[0].status !== 'completed') {
    alerts.push({ id: 'backup-failed', type: 'error' as const, title: '❌ Último backup falhou', icon: <AlertTriangle className="h-4 w-4 text-destructive" /> });
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <Navbar alertCount={alertCount} alerts={alerts} />
      
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
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
          >
            <Card className="shadow-card hover-scale">
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
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="shadow-card hover-scale">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="shadow-card hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Smart Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {backups.filter(b => b.backup_trigger === 'pre_update').length}
                </div>
                <p className="text-sm text-muted-foreground">Backups Pré-Update</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="shadow-card hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" />
                  Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{webhooksCount.active}</div>
                <p className="text-sm text-muted-foreground mb-3">{webhooksCount.total} configurados</p>
                <Link to="/webhooks">
                  <Button variant="outline" size="sm" className="w-full">
                    Gerir
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="shadow-card hover-scale">
              <CardHeader>
                <CardTitle>Plano Ativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 capitalize">{subscription?.plan || "Free"}</div>
                <p className="text-sm text-muted-foreground mb-4">
                  {backups.length} de {subscription?.max_backups || 3} backups
                </p>
                {subscription?.plan === "free" ? (
                  <Link to="/upgrade">
                    <Button variant="hero" size="sm" className="w-full">
                      Fazer Upgrade
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('customer-portal');
                        if (error) throw error;
                        if (data?.url) window.open(data.url, '_blank');
                      } catch (error) {
                        toast.error("Erro ao abrir portal de gestão");
                      }
                    }}
                  >
                    Gerir Subscrição
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mb-8"
        >
          <Card className="shadow-card hover-scale col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Estatísticas de Backups
              </CardTitle>
              <CardDescription>Visão geral do desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Taxa de Sucesso</p>
                  <p className="text-3xl font-bold text-primary">{successRate}%</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-sm text-muted-foreground mb-2">Tamanho Médio</p>
                  <p className="text-3xl font-bold">{avgSize} MB</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Crescimento Médio</p>
                  <p className={`text-3xl font-bold ${Number(avgGrowth) > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {Number(avgGrowth) > 0 ? '+' : ''}{avgGrowth} MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <AlertsPanel 
            backups={backups} 
            subscription={subscription}
            storageUsedGB={storageUsed}
          />
          <BackupTimeline backups={backups} />
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
                        {backup.backup_trigger === 'pre_update' && ' • 🎯 Pré-Update'}
                        {backup.backup_trigger === 'scheduled' && ' • ⏰ Agendado'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(backup.id, backup.filename)}
                        title="Fazer download"
                      >
                        <Download className="w-4 h-4 text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(backup.id)}
                        title="Eliminar"
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
