import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Github, Cloud, HardDrive, Info, Loader2 } from "lucide-react";

interface UserSettings {
  github_token?: string;
  github_repo?: string;
  github_branch?: string;
  github_enabled?: boolean;
  dropbox_token?: string;
  dropbox_enabled?: boolean;
  s3_bucket?: string;
  s3_region?: string;
  s3_access_key?: string;
  s3_secret_key?: string;
  s3_enabled?: boolean;
}

const Integrations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({});

  useEffect(() => {
    checkAuth();
    loadSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('github-sync-config', {
        method: 'GET'
      });

      if (error) throw error;
      
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações das integrações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('github-sync-config', {
        method: 'POST',
        body: settings
      });

      if (error) throw error;

      toast({
        title: "Configurações guardadas",
        description: "As configurações das integrações foram atualizadas com sucesso"
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao guardar",
        description: error.message || "Não foi possível guardar as configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Integrações</h1>
            <p className="text-muted-foreground">
              Configure integrações externas para sincronização e redundância de backups
            </p>
          </div>

          {/* Tabs for different integrations */}
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="github">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </TabsTrigger>
              <TabsTrigger value="dropbox">
                <Cloud className="w-4 h-4 mr-2" />
                Dropbox
              </TabsTrigger>
              <TabsTrigger value="s3">
                <HardDrive className="w-4 h-4 mr-2" />
                Amazon S3
              </TabsTrigger>
            </TabsList>

            {/* GitHub Tab */}
            <TabsContent value="github">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    GitHub Sync
                  </CardTitle>
                  <CardDescription>
                    Sincronize automaticamente as suas configurações YAML para um repositório privado no GitHub
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      <strong>O que é sincronizado:</strong> Todos os ficheiros .yaml da pasta /config do Home Assistant são enviados para o GitHub após cada backup bem-sucedido.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Ativar GitHub Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Sincronizar configurações YAML automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={settings.github_enabled || false}
                      onCheckedChange={(checked) => setSettings({ ...settings, github_enabled: checked })}
                    />
                  </div>

                  {settings.github_enabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="github_token">Personal Access Token</Label>
                        <Input
                          id="github_token"
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxx"
                          value={settings.github_token || ''}
                          onChange={(e) => setSettings({ ...settings, github_token: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Crie um token em:{" "}
                          <a 
                            href="https://github.com/settings/tokens/new?scopes=repo" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            GitHub Settings → Developer settings → Personal access tokens
                          </a>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="github_repo">Repositório</Label>
                        <Input
                          id="github_repo"
                          placeholder="username/home-assistant-config"
                          value={settings.github_repo || ''}
                          onChange={(e) => setSettings({ ...settings, github_repo: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Formato: username/repository-name
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="github_branch">Branch (opcional)</Label>
                        <Input
                          id="github_branch"
                          placeholder="main"
                          value={settings.github_branch || 'main'}
                          onChange={(e) => setSettings({ ...settings, github_branch: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <Button 
                    onClick={saveSettings} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        A guardar...
                      </>
                    ) : (
                      "Guardar Configuração"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dropbox Tab */}
            <TabsContent value="dropbox">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Dropbox Sync
                  </CardTitle>
                  <CardDescription>
                    Replique automaticamente os seus backups para o Dropbox como redundância
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Em desenvolvimento:</strong> Esta funcionalidade estará disponível em breve.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Ativar Dropbox Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Replicar backups para o Dropbox
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* S3 Tab */}
            <TabsContent value="s3">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Amazon S3
                  </CardTitle>
                  <CardDescription>
                    Replique automaticamente os seus backups para Amazon S3 como redundância
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Em desenvolvimento:</strong> Esta funcionalidade estará disponível em breve.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Ativar S3 Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Replicar backups para Amazon S3
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Integrations;
