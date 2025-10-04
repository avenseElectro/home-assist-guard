import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Zap, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function ApiDocs() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="mb-16">
              <h1 className="text-5xl font-bold mb-6">API Documentation</h1>
              <p className="text-xl text-muted-foreground">
                RESTful API para integração programática com o HomeSafe Backup
              </p>
            </div>

            {/* Intro */}
            <section className="mb-16">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                A API HomeSafe permite-lhe integrar backups do Home Assistant diretamente nas suas aplicações, 
                scripts ou automações. Construída com REST, é simples de usar e totalmente documentada.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-card border border-border">
                  <Shield className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Segura</h3>
                  <p className="text-sm text-muted-foreground">Autenticação via Bearer token</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                  <Zap className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Rápida</h3>
                  <p className="text-sm text-muted-foreground">Respostas otimizadas e caching</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                  <Lock className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Confiável</h3>
                  <p className="text-sm text-muted-foreground">Uptime 99.9% garantido</p>
                </div>
              </div>
            </section>

            {/* Base URL */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Base URL</h2>
              <CodeBlock code="https://api.homesafe.com/v1" />
              <p className="text-muted-foreground mt-4">
                Todas as requisições devem ser feitas para este endpoint base.
              </p>
            </section>

            {/* Autenticação */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Autenticação</h2>
              <p className="text-muted-foreground mb-4">
                Todas as requisições à API requerem autenticação via Bearer token. 
                Obtenha a sua API Key no <Link to="/api-keys" className="text-primary hover:underline">dashboard</Link>.
              </p>

              <h3 className="text-xl font-semibold mb-4">Header de Autenticação</h3>
              <CodeBlock code='Authorization: Bearer YOUR_API_KEY' />

              <h3 className="text-xl font-semibold mt-8 mb-4">Exemplo de Requisição</h3>
              <CodeBlock 
                code={`curl https://api.homesafe.com/v1/backups \\
  -H "Authorization: Bearer hsb_1234567890abcdef" \\
  -H "Content-Type: application/json"`}
              />

              <Alert className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Segurança:</strong> Nunca partilhe a sua API Key ou a exponha em código client-side. 
                  Use variáveis de ambiente ou armazenamento seguro.
                </AlertDescription>
              </Alert>
            </section>

            {/* Endpoints */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Endpoints</h2>

              {/* List Backups */}
              <div className="mb-10 p-6 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm font-semibold">GET</span>
                  <code className="text-lg font-mono">/backups</code>
                </div>
                <p className="text-muted-foreground mb-4">Lista todos os backups da conta autenticada.</p>

                <h4 className="font-semibold mb-2">Resposta de Sucesso (200 OK)</h4>
                <CodeBlock 
                  code={`{
  "backups": [
    {
      "id": "bkp_123abc",
      "filename": "homeassistant_2024_01_15.tar",
      "size_bytes": 1048576,
      "created_at": "2024-01-15T03:00:00Z",
      "expires_at": "2024-02-15T03:00:00Z"
    }
  ],
  "total": 5,
  "storage_used_bytes": 5242880
}`}
                  language="json"
                />

                <h4 className="font-semibold mt-6 mb-2">Exemplo</h4>
                <CodeBlock 
                  code={`curl https://api.homesafe.com/v1/backups \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                />
              </div>

              {/* Upload Backup */}
              <div className="mb-10 p-6 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-semibold">POST</span>
                  <code className="text-lg font-mono">/backups</code>
                </div>
                <p className="text-muted-foreground mb-4">Faz upload de um novo backup.</p>

                <h4 className="font-semibold mb-2">Parâmetros (multipart/form-data)</h4>
                <ul className="list-disc list-inside ml-4 mb-4 text-muted-foreground">
                  <li><code>file</code> - Ficheiro .tar do backup (obrigatório)</li>
                  <li><code>retention_days</code> - Dias de retenção (opcional, usa padrão do plano)</li>
                </ul>

                <h4 className="font-semibold mb-2">Resposta de Sucesso (201 Created)</h4>
                <CodeBlock 
                  code={`{
  "id": "bkp_456def",
  "filename": "homeassistant_2024_01_16.tar",
  "size_bytes": 1152000,
  "created_at": "2024-01-16T10:30:00Z",
  "expires_at": "2024-02-16T10:30:00Z"
}`}
                  language="json"
                />

                <h4 className="font-semibold mt-6 mb-2">Exemplo</h4>
                <CodeBlock 
                  code={`curl -X POST https://api.homesafe.com/v1/backups \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/backup.tar" \\
  -F "retention_days=30"`}
                />
              </div>

              {/* Download Backup */}
              <div className="mb-10 p-6 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm font-semibold">GET</span>
                  <code className="text-lg font-mono">/backups/:id/download</code>
                </div>
                <p className="text-muted-foreground mb-4">Descarrega um backup específico.</p>

                <h4 className="font-semibold mb-2">Parâmetros URL</h4>
                <ul className="list-disc list-inside ml-4 mb-4 text-muted-foreground">
                  <li><code>id</code> - ID do backup (obrigatório)</li>
                </ul>

                <h4 className="font-semibold mb-2">Resposta de Sucesso (200 OK)</h4>
                <p className="text-muted-foreground mb-4">Retorna o ficheiro binário .tar com headers apropriados.</p>

                <h4 className="font-semibold mb-2">Exemplo</h4>
                <CodeBlock 
                  code={`curl https://api.homesafe.com/v1/backups/bkp_123abc/download \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -o backup.tar`}
                />
              </div>

              {/* Delete Backup */}
              <div className="mb-10 p-6 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm font-semibold">DELETE</span>
                  <code className="text-lg font-mono">/backups/:id</code>
                </div>
                <p className="text-muted-foreground mb-4">Elimina permanentemente um backup.</p>

                <h4 className="font-semibold mb-2">Parâmetros URL</h4>
                <ul className="list-disc list-inside ml-4 mb-4 text-muted-foreground">
                  <li><code>id</code> - ID do backup (obrigatório)</li>
                </ul>

                <h4 className="font-semibold mb-2">Resposta de Sucesso (204 No Content)</h4>
                <p className="text-muted-foreground mb-4">Sem corpo de resposta. Backup eliminado com sucesso.</p>

                <h4 className="font-semibold mb-2">Exemplo</h4>
                <CodeBlock 
                  code={`curl -X DELETE https://api.homesafe.com/v1/backups/bkp_123abc \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                />
              </div>

              {/* Account Info */}
              <div className="mb-10 p-6 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm font-semibold">GET</span>
                  <code className="text-lg font-mono">/account</code>
                </div>
                <p className="text-muted-foreground mb-4">Obtém informações da conta e limites.</p>

                <h4 className="font-semibold mb-2">Resposta de Sucesso (200 OK)</h4>
                <CodeBlock 
                  code={`{
  "plan": "pro",
  "storage_limit_bytes": 10737418240,
  "storage_used_bytes": 5242880,
  "backup_count": 5,
  "backup_limit": 10,
  "retention_days": 30
}`}
                  language="json"
                />
              </div>
            </section>

            {/* Códigos de Erro */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Códigos de Erro</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-4 font-semibold">Código</th>
                      <th className="text-left p-4 font-semibold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-4"><code>400</code></td>
                      <td className="p-4">Bad Request - Parâmetros inválidos</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4"><code>401</code></td>
                      <td className="p-4">Unauthorized - API Key inválida ou ausente</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4"><code>403</code></td>
                      <td className="p-4">Forbidden - Limite de plano atingido</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4"><code>404</code></td>
                      <td className="p-4">Not Found - Recurso não encontrado</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4"><code>413</code></td>
                      <td className="p-4">Payload Too Large - Backup excede limite</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4"><code>429</code></td>
                      <td className="p-4">Too Many Requests - Rate limit excedido</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4"><code>500</code></td>
                      <td className="p-4">Internal Server Error - Erro do servidor</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold mt-8 mb-4">Formato de Erro</h3>
              <CodeBlock 
                code={`{
  "error": {
    "code": "storage_limit_exceeded",
    "message": "Storage limit exceeded. Delete old backups or upgrade plan.",
    "details": {
      "storage_used": 10737418240,
      "storage_limit": 10737418240
    }
  }
}`}
                language="json"
              />
            </section>

            {/* Rate Limits */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Rate Limits</h2>
              <p className="text-muted-foreground mb-6">
                Os limites de taxa aplicam-se por API Key e são baseados no plano da conta:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-4 font-semibold">Plano</th>
                      <th className="text-center p-4 font-semibold">Requests/Hora</th>
                      <th className="text-center p-4 font-semibold">Requests/Dia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-4">Free</td>
                      <td className="text-center p-4">100</td>
                      <td className="text-center p-4">1,000</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4">Pro</td>
                      <td className="text-center p-4">1,000</td>
                      <td className="text-center p-4">10,000</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4">Business</td>
                      <td className="text-center p-4">10,000</td>
                      <td className="text-center p-4">100,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Alert className="mt-6">
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Os limites são resetados no início de cada hora. Headers <code>X-RateLimit-*</code> 
                  indicam o uso atual em cada resposta.
                </AlertDescription>
              </Alert>
            </section>

            {/* SDKs */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">SDKs e Bibliotecas</h2>
              <p className="text-muted-foreground mb-6">
                Brevemente disponibilizaremos SDKs oficiais para facilitar a integração:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">🐍 Python</h3>
                  <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
                </div>
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">📘 TypeScript/Node.js</h3>
                  <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
                </div>
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">🦀 Rust</h3>
                  <p className="text-sm text-muted-foreground">Planeado</p>
                </div>
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">☕ Java</h3>
                  <p className="text-sm text-muted-foreground">Planeado</p>
                </div>
              </div>
            </section>

            {/* Suporte */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Suporte</h2>
              <p className="text-muted-foreground mb-4">
                Precisa de ajuda com a API? Entre em contacto:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>📧 Email: <a href="mailto:api@homesafe.com" className="text-primary hover:underline">api@homesafe.com</a></li>
                <li>📖 Documentação: <Link to="/docs" className="text-primary hover:underline">Ver guias completos</Link></li>
                <li>💬 GitHub: <a href="https://github.com/avenseElectro/home-assist-guard/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Reportar problemas</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
