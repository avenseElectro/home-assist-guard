import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, Copy, Download, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const LovelaceGuide = () => {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const yamlConfig = `type: custom:homesafe-card
title: HomeSafe Backups
api_key: hsb_your_api_key_here`;

  const installScript = `# No painel Lovelace, clique em "Editar Dashboard"
# Depois clique no botão "⋮" (três pontos) no canto superior direito
# Selecione "Gerir recursos"
# Clique em "+ Adicionar recurso"
# Cole o URL abaixo:

/local/homesafe-card.js`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4" variant="secondary">
              🏠 Home Assistant Integration
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Lovelace Custom Card
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Visualize os seus backups diretamente no painel do Home Assistant
            </p>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  Pré-visualização do Card
                </CardTitle>
                <CardDescription>
                  Assim ficará o card no seu Lovelace Dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 border-2 border-border">
                  <img 
                    src="https://via.placeholder.com/800x400/1e293b/94a3b8?text=HomeSafe+Card+Preview" 
                    alt="Lovelace Card Preview"
                    className="w-full rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Installation Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold mb-6">📦 Instalação</h2>

            {/* Step 1 */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <CardTitle>Instalar o HomeSafe Add-on</CardTitle>
                    <CardDescription className="mt-2">
                      O add-on deve estar instalado e configurado no seu Home Assistant
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    Se ainda não instalou o add-on, consulte a{" "}
                    <a href="/docs" className="text-primary hover:underline">
                      documentação de instalação
                    </a>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <CardTitle>Descarregar o Card JavaScript</CardTitle>
                    <CardDescription className="mt-2">
                      Faça download do ficheiro do custom card
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    window.open('/homesafe-card.js', '_blank');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descarregar homesafe-card.js
                </Button>
                <Alert>
                  <AlertDescription>
                    Coloque o ficheiro na pasta <code className="bg-muted px-2 py-1 rounded">/config/www/</code> do seu Home Assistant
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <CardTitle>Registar o Recurso no Lovelace</CardTitle>
                    <CardDescription className="mt-2">
                      Adicione o card como recurso JavaScript no Lovelace
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 relative">
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                    {installScript}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('/local/homesafe-card.js', 'step3')}
                  >
                    {copiedStep === 'step3' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Alert>
                  <Settings className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Passos detalhados:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Abra o seu Lovelace Dashboard</li>
                      <li>Clique em "Editar Dashboard" (canto superior direito)</li>
                      <li>Clique no menu "⋮" e selecione "Gerir recursos"</li>
                      <li>Clique em "+ Adicionar recurso"</li>
                      <li>Cole o URL: <code className="bg-background px-2 py-1 rounded">/local/homesafe-card.js</code></li>
                      <li>Selecione tipo "JavaScript Module"</li>
                      <li>Clique em "Criar"</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <CardTitle>Gerar API Key</CardTitle>
                    <CardDescription className="mt-2">
                      Crie uma API key para o card comunicar com o HomeSafe
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Como gerar a API Key:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Vá ao Dashboard do HomeSafe em <a href="/dashboard" className="text-primary hover:underline">Dashboard</a></li>
                      <li>Clique em "API Keys" no menu superior</li>
                      <li>Clique em "Generate New API Key"</li>
                      <li>Dê um nome (ex: "Lovelace Card")</li>
                      <li>Copie a chave gerada (começa com <code className="bg-background px-2 py-1 rounded">hsb_</code>)</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                <Alert className="border-amber-500 bg-amber-500/10">
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    ⚠️ <strong>Importante:</strong> Guarde a API key num local seguro. Ela só é mostrada uma vez!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 5 */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    5
                  </div>
                  <div className="flex-1">
                    <CardTitle>Adicionar o Card ao Dashboard</CardTitle>
                    <CardDescription className="mt-2">
                      Configure o card no seu Lovelace com a API key
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 relative">
                  <pre className="text-sm overflow-x-auto">
                    {yamlConfig}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(yamlConfig, 'step4')}
                  >
                    {copiedStep === 'step4' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Alert>
                  <AlertDescription>
                    <strong>Como adicionar:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>No modo de edição do Dashboard, clique em "+ Adicionar Cartão"</li>
                      <li>Desça até ao fundo e clique em "Manual"</li>
                      <li>Cole a configuração YAML acima</li>
                      <li><strong>Substitua <code className="bg-background px-2 py-1 rounded">hsb_your_api_key_here</code> pela sua API key real</strong></li>
                      <li>Clique em "Guardar"</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 6 */}
            <Card className="shadow-card border-primary">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    ✅
                  </div>
                  <div className="flex-1">
                    <CardTitle>Tudo Pronto!</CardTitle>
                    <CardDescription className="mt-2">
                      O card está agora disponível no seu Dashboard
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="bg-primary/10 border-primary">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <AlertDescription className="text-primary">
                    <strong>Funcionalidades disponíveis:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Lista dos 5 backups mais recentes</li>
                      <li>Status de cada backup (completo, a decorrer, falha)</li>
                      <li>Data, tamanho e tipo de trigger de cada backup</li>
                      <li>Botão para criar backup manual</li>
                      <li>Atualização automática dos dados</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>

          {/* Troubleshooting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-3xl font-bold mb-6">🔧 Resolução de Problemas</h2>
            <Card className="shadow-card">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Card não aparece no Dashboard</h3>
                  <p className="text-muted-foreground text-sm">
                    - Verifique se o ficheiro está em <code className="bg-muted px-2 py-1 rounded">/config/www/homesafe-card.js</code><br />
                    - Reinicie o Home Assistant após copiar o ficheiro<br />
                    - Limpe a cache do browser (Ctrl + Shift + R)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Card mostra erro 401 (Unauthorized)</h3>
                  <p className="text-muted-foreground text-sm">
                    - Verifique se configurou a API key correta no YAML<br />
                    - A API key deve começar com <code className="bg-muted px-2 py-1 rounded">hsb_</code><br />
                    - Gere uma nova API key se necessário no Dashboard → API Keys
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Card mostra "A carregar..." indefinidamente</h3>
                  <p className="text-muted-foreground text-sm">
                    - Verifique a configuração da API key no card YAML<br />
                    - Confirme que tem acesso à internet<br />
                    - Limpe a cache do browser (Ctrl + Shift + R)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Botão "Backup Manual" não funciona</h3>
                  <p className="text-muted-foreground text-sm">
                    - Verifique a configuração da API Key no add-on<br />
                    - Confirme que tem espaço disponível na sua subscrição<br />
                    - Consulte os logs do add-on para erros
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LovelaceGuide;
