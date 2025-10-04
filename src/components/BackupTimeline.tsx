import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Backup {
  id: string;
  filename: string;
  created_at: string;
  size_bytes: number;
  status: string;
  ha_version: string | null;
  backup_trigger?: string;
}

interface BackupTimelineProps {
  backups: Backup[];
}

export function BackupTimeline({ backups }: BackupTimelineProps) {
  const [filter, setFilter] = useState<string>('all');
  
  const filteredBackups = filter === 'all' 
    ? backups 
    : backups.filter(b => b.backup_trigger === filter);
  
  const recentBackups = filteredBackups.slice(0, 10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const getSizeDiff = (currentSize: number, previousSize: number | null) => {
    if (!previousSize) return null;
    const diff = currentSize - previousSize;
    const diffMB = diff / (1024 * 1024);
    return diffMB;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTriggerBadge = (trigger?: string) => {
    switch (trigger) {
      case 'pre_update':
        return <span className="text-xs text-primary">🎯 Pré-Update</span>;
      case 'scheduled':
        return <span className="text-xs text-muted-foreground">⏰ Agendado</span>;
      case 'api':
        return <span className="text-xs text-muted-foreground">🔌 API</span>;
      default:
        return <span className="text-xs text-muted-foreground">✋ Manual</span>;
    }
  };

  if (backups.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Timeline de Backups</CardTitle>
            <CardDescription>Histórico dos últimos 10 backups</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
              <Badge variant="secondary" className="ml-2">
                {backups.length}
              </Badge>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filter === 'pre_update' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pre_update')}
                  >
                    🎯
                    <Badge variant="secondary" className="ml-2">
                      {backups.filter(b => b.backup_trigger === 'pre_update').length}
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Backups Pré-Update</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filter === 'scheduled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('scheduled')}
                  >
                    ⏰
                    <Badge variant="secondary" className="ml-2">
                      {backups.filter(b => b.backup_trigger === 'scheduled').length}
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Backups Agendados</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {recentBackups.map((backup, index) => {
              const previousBackup = recentBackups[index + 1];
              const sizeDiff = previousBackup ? getSizeDiff(backup.size_bytes, previousBackup.size_bytes) : null;

              return (
                <motion.div
                  key={backup.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative pl-10"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    {getStatusIcon(backup.status)}
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-smooth cursor-pointer">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{backup.filename}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(backup.created_at)}
                              </p>
                            </div>
                            <Badge variant={backup.status === "completed" ? "default" : "destructive"}>
                              {backup.status === "completed" ? "✅ Completo" : "❌ Falhou"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <span className="text-muted-foreground">
                              📊 {formatSize(backup.size_bytes)}
                            </span>

                            {sizeDiff !== null && (
                              <span className={`flex items-center gap-1 ${sizeDiff > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                {sizeDiff > 0 ? (
                                  <>
                                    <TrendingUp className="w-3 h-3" />
                                    +{Math.abs(sizeDiff).toFixed(0)} MB
                                  </>
                                ) : sizeDiff < 0 ? (
                                  <>
                                    <TrendingDown className="w-3 h-3" />
                                    -{Math.abs(sizeDiff).toFixed(0)} MB
                                  </>
                                ) : (
                                  '0 MB'
                                )}
                              </span>
                            )}

                            {backup.ha_version && (
                              <span className="text-muted-foreground">
                                🏠 HA {backup.ha_version}
                              </span>
                            )}

                            {getTriggerBadge(backup.backup_trigger)}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="font-semibold mb-1">{backup.filename}</p>
                        <p className="text-xs">Criado: {new Date(backup.created_at).toLocaleString('pt-PT')}</p>
                        <p className="text-xs">Tamanho: {formatSize(backup.size_bytes)}</p>
                        {backup.ha_version && <p className="text-xs">Home Assistant: v{backup.ha_version}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
