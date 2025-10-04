import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface AlertsPanelProps {
  backups: Backup[];
  subscription: Subscription | null;
  storageUsedGB: number;
  webhookFailures?: number;
}

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  icon: React.ReactNode;
}

export function AlertsPanel({ backups, subscription, storageUsedGB, webhookFailures = 0 }: AlertsPanelProps) {
  const alerts: AlertItem[] = [];

  // Alert 1: No backups in 48 hours
  if (backups.length > 0) {
    const lastBackupDate = new Date(backups[0].created_at);
    const hoursSinceLastBackup = (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastBackup > 48) {
      alerts.push({
        id: 'no-backup-48h',
        type: 'warning',
        title: '⚠️ Sem backups há mais de 48h',
        message: `Último backup foi há ${Math.floor(hoursSinceLastBackup)} horas. Considere criar um novo backup.`,
        icon: <AlertTriangle className="h-4 w-4" />
      });
    }
  } else {
    alerts.push({
      id: 'no-backups',
      type: 'info',
      title: '📦 Ainda não tem backups',
      message: 'Configure o HomeSafe Add-on no seu Home Assistant para criar o primeiro backup.',
      icon: <Info className="h-4 w-4" />
    });
  }

  // Alert 2: Storage almost full (>80%)
  const storageLimit = subscription?.max_storage_gb || 1;
  const storagePercentage = (storageUsedGB / storageLimit) * 100;

  if (storagePercentage > 80) {
    alerts.push({
      id: 'storage-full',
      type: 'error',
      title: '📈 Storage quase cheio',
      message: `${storagePercentage.toFixed(0)}% do espaço utilizado (${storageUsedGB.toFixed(2)} GB de ${storageLimit} GB). Considere fazer upgrade ou eliminar backups antigos.`,
      icon: <AlertTriangle className="h-4 w-4" />
    });
  }

  // Alert 3: Last backup failed
  if (backups.length > 0 && backups[0].status !== 'completed') {
    alerts.push({
      id: 'backup-failed',
      type: 'error',
      title: '❌ Último backup falhou',
      message: `O backup "${backups[0].filename}" não foi concluído com sucesso. Verifique os logs do add-on.`,
      icon: <AlertTriangle className="h-4 w-4" />
    });
  }

  // Alert 4: HA version changed (recommend backup)
  if (backups.length >= 2) {
    const latestVersion = backups[0].ha_version;
    const previousVersion = backups[1].ha_version;
    
    if (latestVersion && previousVersion && latestVersion !== previousVersion) {
      alerts.push({
        id: 'ha-version-changed',
        type: 'info',
        title: '🔄 Versão do HA mudou',
        message: `Home Assistant atualizado de ${previousVersion} para ${latestVersion}. Novo backup recomendado.`,
        icon: <Info className="h-4 w-4" />
      });
    }
  }

  // Alert 5: Webhook failures
  if (webhookFailures > 0) {
    alerts.push({
      id: 'webhook-failures',
      type: 'warning',
      title: '⚠️ Webhook com falhas',
      message: `${webhookFailures} webhook(s) com entregas falhadas nas últimas 24h. Verifique a configuração.`,
      icon: <AlertTriangle className="h-4 w-4" />
    });
  }

  // Success message if everything is ok
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      type: 'success',
      title: '✅ Tudo em ordem',
      message: 'Os seus backups estão atualizados e o sistema está a funcionar corretamente.',
      icon: <CheckCircle className="h-4 w-4" />
    });
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alertas do Sistema</CardTitle>
            <CardDescription>
              {alerts.length === 1 && alerts[0].type === 'success' 
                ? 'Sem problemas detetados' 
                : `${alerts.filter(a => a.type !== 'success').length} ${alerts.filter(a => a.type !== 'success').length === 1 ? 'alerta ativo' : 'alertas ativos'}`
              }
            </CardDescription>
          </div>
          {alerts.filter(a => a.type !== 'success').length > 0 && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive text-destructive-foreground font-bold text-sm">
              {alerts.filter(a => a.type !== 'success').length}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert 
            key={alert.id}
            variant={alert.type === 'error' || alert.type === 'warning' ? 'destructive' : 'default'}
            className="transition-smooth"
          >
            {alert.icon}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}

export function getAlertCount(backups: Backup[], subscription: Subscription | null, storageUsedGB: number): number {
  let count = 0;

  // No backups in 48h
  if (backups.length > 0) {
    const hoursSinceLastBackup = (Date.now() - new Date(backups[0].created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastBackup > 48) count++;
  }

  // Storage > 80%
  const storageLimit = subscription?.max_storage_gb || 1;
  if ((storageUsedGB / storageLimit) * 100 > 80) count++;

  // Last backup failed
  if (backups.length > 0 && backups[0].status !== 'completed') count++;

  return count;
}
