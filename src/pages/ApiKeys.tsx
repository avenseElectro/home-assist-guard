import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Trash2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardNavbar as Navbar } from "@/components/DashboardNavbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

const ApiKeys = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, created_at, last_used_at")
        .eq("user_id", user!.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Erro ao carregar API keys");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Nome da API key é obrigatório");
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-key-generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newKeyName }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao criar API key");
      }

      const result = await response.json();
      setGeneratedKey(result.api_key);
      setNewKeyName("");
      fetchApiKeys();
      toast.success("API key criada com sucesso");
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Erro ao criar API key");
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm("Tem certeza que deseja revogar esta API key?")) return;

    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", keyId)
        .eq("user_id", user!.id);

      if (error) {
        console.error("RLS error details:", error);
        throw error;
      }

      toast.success("API key revogada com sucesso");
      fetchApiKeys();
    } catch (error: any) {
      console.error("Error revoking API key:", error);
      toast.error(`Erro ao revogar: ${error.message || "Erro desconhecido"}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Gere e gerencie API keys para o HomeSafe Connector
            </p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Criar Nova API Key</CardTitle>
            <CardDescription>
              Use esta API key no seu Home Assistant Add-on para autenticar os backups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="keyName">Nome da API Key</Label>
                <Input
                  id="keyName"
                  placeholder="Ex: Home Assistant Principal"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => setShowDialog(true)} disabled={creating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar API Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys Ativas</CardTitle>
            <CardDescription>Suas API keys existentes</CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Ainda não tem API keys. Crie uma para começar a usar o HomeSafe Connector.
              </p>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{key.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>
                          Criada: {new Date(key.created_at).toLocaleDateString('pt-PT')}
                        </span>
                        {key.last_used_at && (
                          <span>
                            Último uso: {new Date(key.last_used_at).toLocaleDateString('pt-PT')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => revokeApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar API Key</DialogTitle>
            <DialogDescription>
              {generatedKey
                ? "Guarde esta API key num local seguro. Não será possível vê-la novamente."
                : "Confirme a criação da nova API key"}
            </DialogDescription>
          </DialogHeader>
          {generatedKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm break-all">{generatedKey}</code>
              </div>
              <Button
                onClick={() => copyToClipboard(generatedKey)}
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p>
                Está prestes a criar uma API key com o nome: <strong>{newKeyName}</strong>
              </p>
            </div>
          )}
          <DialogFooter>
            {generatedKey ? (
              <Button
                onClick={() => {
                  setShowDialog(false);
                  setGeneratedKey("");
                }}
              >
                Fechar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={createApiKey} disabled={creating}>
                  {creating ? "A criar..." : "Confirmar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeys;
