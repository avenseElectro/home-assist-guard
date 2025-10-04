import { useState } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Webhook as WebhookIcon, Plus, Trash2, Edit, TestTube, Activity } from "lucide-react";
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestWebhook, useWebhookLogs, CreateWebhookInput } from "@/hooks/useWebhooks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const AVAILABLE_EVENTS = [
  { id: 'backup.completed', label: 'Backup Concluído', icon: '✅' },
  { id: 'backup.failed', label: 'Backup Falhado', icon: '❌' },
  { id: 'backup.deleted', label: 'Backup Eliminado', icon: '🗑️' },
];

export default function Webhooks() {
  const { data: webhooks, isLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateWebhookInput>({
    name: '',
    webhook_url: '',
    events: [],
    enabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWebhook) {
      await updateWebhook.mutateAsync({ id: editingWebhook, ...formData });
      setEditingWebhook(null);
    } else {
      await createWebhook.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    }
    
    setFormData({ name: '', webhook_url: '', events: [], enabled: true });
  };

  const handleEdit = (webhook: any) => {
    setFormData({
      name: webhook.name,
      webhook_url: webhook.webhook_url,
      events: webhook.events,
      enabled: webhook.enabled,
    });
    setEditingWebhook(webhook.id);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateWebhook.mutateAsync({ id, enabled });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                  <WebhookIcon className="w-6 h-6 text-primary-foreground" />
                </div>
                Webhooks
              </h1>
              <p className="text-muted-foreground">Configure notificações em tempo real sobre eventos de backup</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Criar Webhook</DialogTitle>
                    <DialogDescription>
                      Configure um novo webhook para receber notificações de eventos
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Notificações Discord"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="url">URL do Webhook</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://exemplo.com/webhook"
                        value={formData.webhook_url}
                        onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Eventos</Label>
                      {AVAILABLE_EVENTS.map((event) => (
                        <div key={event.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={event.id}
                            checked={formData.events.includes(event.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, events: [...formData.events, event.id] });
                              } else {
                                setFormData({ ...formData, events: formData.events.filter(e => e !== event.id) });
                              }
                            }}
                          />
                          <Label htmlFor={event.id} className="cursor-pointer">
                            {event.icon} {event.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                      />
                      <Label htmlFor="enabled">Ativo</Label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit">Criar Webhook</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Separator className="my-8" />
        </div>

        {isLoading ? (
          <div className="text-center py-12">A carregar webhooks...</div>
        ) : webhooks && webhooks.length > 0 ? (
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                onEdit={handleEdit}
                onDelete={(id) => deleteWebhook.mutate(id)}
                onToggle={handleToggle}
                onTest={(id) => testWebhook.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <WebhookIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Ainda não tem webhooks</h3>
              <p className="text-muted-foreground mb-4">
                Crie o seu primeiro webhook para começar a receber notificações
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function WebhookCard({ webhook, onEdit, onDelete, onToggle, onTest }: any) {
  const { data: logs } = useWebhookLogs(webhook.id);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  
  const recentFailures = logs?.filter(log => 
    log.status === 'failed' && 
    new Date(log.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length || 0;

  const getStatusBadge = () => {
    if (!webhook.enabled) {
      return <Badge variant="secondary">🔴 Inativo</Badge>;
    }
    if (recentFailures > 0) {
      return <Badge variant="destructive">⚠️ Com erros</Badge>;
    }
    return <Badge variant="default">🟢 Ativo</Badge>;
  };

  return (
    <Card className="hover-scale">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{webhook.name}</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="break-all">{webhook.webhook_url}</CardDescription>
            <div className="flex items-center gap-2 mt-2">
              {webhook.events.map((event: string) => (
                <Badge key={event} variant="outline">
                  {AVAILABLE_EVENTS.find(e => e.id === event)?.icon} {event}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2 flex-wrap">
          <Switch
            checked={webhook.enabled}
            onCheckedChange={(checked) => onToggle(webhook.id, checked)}
          />
          <span className="text-sm text-muted-foreground">
            {webhook.enabled ? 'Ativo' : 'Inativo'}
          </span>
          
          <div className="flex-1" />
          
          <Button variant="outline" size="sm" onClick={() => onTest(webhook.id)}>
            <TestTube className="h-4 w-4 mr-2" />
            Testar
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onEdit(webhook)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar webhook?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser revertida. O webhook será eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(webhook.id)}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
