import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocsSection } from "@/components/docs/DocsSection";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { InstallationSteps } from "@/components/docs/InstallationSteps";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Shield, Clock, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Docs() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <DocsLayout>
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">Documentação</h1>
            <p className="text-xl text-muted-foreground">
              Guia completo para configurar e usar o HomeSafe Backup no seu Home Assistant
            </p>
          </div>

          {/* Introdução */}
          <DocsSection id="introducao" title="Introdução">
            <p className="text-lg">
              O <strong>HomeSafe Backup</strong> é uma solução completa e segura para fazer backups automáticos 
              do seu Home Assistant na cloud. Proteja as suas configurações, automações e dados com encriptação 
              de ponta e retenção configurável.
            </p>

            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-lg bg-card border border-border">
                <Shield className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Seguro</h3>
                <p className="text-sm">Encriptação AES-256 e armazenamento seguro</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <Clock className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Automático</h3>
                <p className="text-sm">Backups agendados sem intervenção manual</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <Database className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Confiável</h3>
                <p className="text-sm">Retenção configurável e recuperação fácil</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Como Funciona</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Instale o add-on no Home Assistant</li>
              <li>Configure a API Key do HomeSafe</li>
              <li>Os backups são criados automaticamente</li>
              <li>Gerencie e restaure através do dashboard web</li>
            </ol>

            <Alert className="mt-6">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Requisitos:</strong> Home Assistant OS, Supervisor ou Container. 
                Conexão à internet estável. Conta no HomeSafe Backup.
              </AlertDescription>
            </Alert>
          </DocsSection>

          {/* Instalação */}
          <DocsSection id="instalacao" title="Instalação do Add-on">
            <h3 className="text-xl font-semibold">Método 1: Repositório Personalizado (Recomendado)</h3>
            <p>A forma mais simples de instalar o add-on:</p>
            
            <InstallationSteps
              steps={[
                {
                  title: "Abrir Supervisor",
                  description: "No Home Assistant, vá para Settings > Add-ons"
                },
                {
                  title: "Adicionar Repositório",
                  description: "Clique em 'Add-on Store' no canto inferior direito, depois nos 3 pontos no canto superior direito e selecione 'Repositories'"
                },
                {
                  title: "Cole o URL",
                  description: "Adicione o seguinte URL e clique em 'Add'"
                },
                {
                  title: "Instalar o Add-on",
                  description: "Procure por 'HomeSafe Backup' na loja e clique em 'Install'"
                }
              ]}
            />

            <CodeBlock code="https://github.com/avenseElectro/home-assist-guard" />

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Após a instalação, não se esqueça de configurar a API Key antes de iniciar o add-on!
              </AlertDescription>
            </Alert>

            <h3 className="text-xl font-semibold mt-10">Método 2: Instalação Manual</h3>
            <p>Para instalação manual ou desenvolvimento:</p>

            <InstallationSteps
              steps={[
                {
                  title: "Download do Código",
                  description: "Faça download do add-on do repositório GitHub"
                },
                {
                  title: "Extrair Ficheiros",
                  description: "Extraia a pasta 'homeassistant-addon' para o diretório /addons/ do Home Assistant"
                },
                {
                  title: "Recarregar Add-ons",
                  description: "No Supervisor, clique em 'Reload' para detetar o novo add-on"
                },
                {
                  title: "Instalar",
                  description: "O add-on aparecerá na lista de add-ons locais"
                }
              ]}
            />

            <Button asChild variant="outline" className="mt-4">
              <a 
                href="https://github.com/avenseElectro/home-assist-guard/tree/main/homeassistant-addon" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Ver no GitHub →
              </a>
            </Button>
          </DocsSection>

          {/* Configuração */}
          <DocsSection id="configuracao" title="Configuração">
            <h3 className="text-xl font-semibold">1. Obter a API Key</h3>
            <p>Primeiro, precisa de gerar uma API Key no dashboard do HomeSafe:</p>

            <InstallationSteps
              steps={[
                {
                  title: "Login no HomeSafe",
                  description: "Aceda ao dashboard em homesafe.com e faça login"
                },
                {
                  title: "Navegar para API Keys",
                  description: "No menu, selecione 'API Keys'"
                },
                {
                  title: "Gerar Nova Chave",
                  description: "Clique em 'Generate New Key' e dê um nome descritivo (ex: 'Home Assistant')"
                },
                {
                  title: "Copiar a Chave",
                  description: "Copie a chave gerada - não poderá vê-la novamente!"
                }
              ]}
            />

            <Alert className="mt-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Guarde a API Key num local seguro. Ela garante acesso aos seus backups.
              </AlertDescription>
            </Alert>

            <h3 className="text-xl font-semibold mt-10">2. Configurar o Add-on</h3>
            <p>No Home Assistant, configure o add-on com os seguintes parâmetros:</p>

            <div className="bg-card border border-border rounded-lg p-6 mt-4">
              <h4 className="font-semibold mb-4">Opções de Configuração</h4>
              <div className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">api_url</code>
                  <p className="text-sm mt-1">URL da API HomeSafe (já pré-configurado)</p>
                  <CodeBlock code="https://iagsshcczgmjdrdweirb.supabase.co/functions/v1" />
                </div>
                
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">api_key</code>
                  <p className="text-sm mt-1">A chave API que obteve no passo anterior</p>
                  <CodeBlock code="seu-api-key-aqui" />
                </div>
                
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">auto_backup_enabled</code>
                  <p className="text-sm mt-1">Ativar backups automáticos diários (true/false)</p>
                  <CodeBlock code="true" />
                </div>
                
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">backup_time</code>
                  <p className="text-sm mt-1">Hora do backup automático (formato HH:MM)</p>
                  <CodeBlock code="03:00" />
                </div>
                
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">retention_days</code>
                  <p className="text-sm mt-1">Dias de retenção (depende do seu plano)</p>
                  <CodeBlock code="7" />
                </div>
              </div>
            </div>

            <h4 className="font-semibold mt-6">Exemplo de Configuração Completa:</h4>
            <CodeBlock 
              code={`{
  "api_url": "https://iagsshcczgmjdrdweirb.supabase.co/functions/v1",
  "api_key": "hsb_1234567890abcdef",
  "auto_backup_enabled": true,
  "backup_time": "03:00",
  "retention_days": 7
}`}
              language="json"
            />
          </DocsSection>

          {/* Utilização */}
          <DocsSection id="utilizacao" title="Utilização">
            <h3 className="text-xl font-semibold">Backups Automáticos</h3>
            <p>
              Com <code className="text-sm bg-muted px-2 py-1 rounded">auto_backup_enabled: true</code>, 
              o add-on cria backups automaticamente todos os dias à hora configurada.
            </p>
            
            <div className="bg-card border border-border rounded-lg p-6 mt-4">
              <h4 className="font-semibold mb-3">O que é incluído no backup:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Todas as configurações do Home Assistant</li>
                <li>Automações e scripts</li>
                <li>Integrações e dispositivos</li>
                <li>Dashboards e visualizações</li>
                <li>Add-ons instalados (lista)</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-10">Backups Manuais</h3>
            <p>Para criar um backup manual a qualquer momento:</p>

            <ol className="list-decimal list-inside space-y-2 ml-4 mt-4">
              <li>Abra o add-on HomeSafe Backup</li>
              <li>Vá ao separador 'Logs'</li>
              <li>O add-on expõe um serviço <code className="text-sm bg-muted px-2 py-1 rounded">homesafe.create_backup</code></li>
              <li>Use este serviço em automações ou scripts</li>
            </ol>

            <h4 className="font-semibold mt-6">Exemplo de Automação:</h4>
            <CodeBlock 
              code={`automation:
  - alias: "Backup Manual"
    trigger:
      - platform: state
        entity_id: input_boolean.manual_backup
        to: 'on'
    action:
      - service: homesafe.create_backup
      - service: input_boolean.turn_off
        entity_id: input_boolean.manual_backup`}
              language="yaml"
            />

            <h3 className="text-xl font-semibold mt-10">Visualizar Logs</h3>
            <p>Acompanhe o progresso dos backups nos logs do add-on:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>Vá para Settings → Add-ons → HomeSafe Backup</li>
              <li>Clique no separador 'Log'</li>
              <li>Veja informações sobre backups criados, erros e status</li>
            </ul>
          </DocsSection>

          {/* Gestão de Backups */}
          <DocsSection id="gestao" title="Gestão de Backups">
            <h3 className="text-xl font-semibold">Dashboard Web</h3>
            <p>
              Todos os seus backups são acessíveis através do <Link to="/dashboard" className="text-primary hover:underline">dashboard web</Link> do HomeSafe. 
              Faça login para visualizar, descarregar ou eliminar backups.
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-lg bg-card border border-border">
                <h4 className="font-semibold mb-2">📋 Listar Backups</h4>
                <p className="text-sm">
                  Veja todos os backups organizados por data, com informações de tamanho e status
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h4 className="font-semibold mb-2">⬇️ Download</h4>
                <p className="text-sm">
                  Descarregue qualquer backup para o seu computador
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h4 className="font-semibold mb-2">🗑️ Eliminar</h4>
                <p className="text-sm">
                  Remova backups antigos para libertar espaço
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h4 className="font-semibold mb-2">📊 Estatísticas</h4>
                <p className="text-sm">
                  Monitorize uso de armazenamento e limite de backups
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-10">Restaurar um Backup</h3>
            <p>Para restaurar o Home Assistant a partir de um backup:</p>

            <InstallationSteps
              steps={[
                {
                  title: "Download do Backup",
                  description: "No dashboard, descarregue o backup que deseja restaurar"
                },
                {
                  title: "Aceder ao Supervisor",
                  description: "No Home Assistant, vá para Settings > System > Backups"
                },
                {
                  title: "Upload do Ficheiro",
                  description: "Clique em 'Upload Backup' e selecione o ficheiro descarregado"
                },
                {
                  title: "Restaurar",
                  description: "Selecione o backup e clique em 'Restore'. O sistema irá reiniciar"
                }
              ]}
            />

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> O processo de restauro pode demorar vários minutos. 
                Não desligue o sistema durante este processo.
              </AlertDescription>
            </Alert>
          </DocsSection>

          {/* Troubleshooting */}
          <DocsSection id="troubleshooting" title="Troubleshooting">
            <h3 className="text-xl font-semibold">Problemas Comuns e Soluções</h3>

            <div className="space-y-6 mt-6">
              <div className="border-l-4 border-destructive pl-4">
                <h4 className="font-semibold">❌ Erro: API Key Inválida</h4>
                <p className="text-sm mt-2"><strong>Causa:</strong> API Key incorreta ou expirada</p>
                <p className="text-sm mt-1"><strong>Solução:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Verifique se copiou a chave completa</li>
                  <li>Gere uma nova API Key no dashboard</li>
                  <li>Atualize a configuração do add-on</li>
                </ul>
              </div>

              <div className="border-l-4 border-destructive pl-4">
                <h4 className="font-semibold">❌ Falha na Criação de Snapshot</h4>
                <p className="text-sm mt-2"><strong>Causa:</strong> Falta de espaço em disco ou permissões</p>
                <p className="text-sm mt-1"><strong>Solução:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Verifique o espaço disponível no Home Assistant</li>
                  <li>Elimine backups antigos locais</li>
                  <li>Reinicie o Supervisor</li>
                </ul>
              </div>

              <div className="border-l-4 border-destructive pl-4">
                <h4 className="font-semibold">❌ Erro 404 ao Eliminar Backup</h4>
                <p className="text-sm mt-2"><strong>Causa:</strong> Backup já foi eliminado ou não existe</p>
                <p className="text-sm mt-1"><strong>Solução:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Atualize a lista de backups no dashboard</li>
                  <li>Verifique se o backup ainda existe</li>
                </ul>
              </div>

              <div className="border-l-4 border-amber-500 pl-4">
                <h4 className="font-semibold">⚠️ Limite de Backups Atingido</h4>
                <p className="text-sm mt-2"><strong>Causa:</strong> Plano atingiu o número máximo de backups</p>
                <p className="text-sm mt-1"><strong>Solução:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Elimine backups antigos</li>
                  <li>Considere fazer upgrade do plano</li>
                  <li>Ajuste o retention_days</li>
                </ul>
              </div>

              <div className="border-l-4 border-amber-500 pl-4">
                <h4 className="font-semibold">⚠️ Falta de Espaço de Armazenamento</h4>
                <p className="text-sm mt-2"><strong>Causa:</strong> Limite de storage do plano atingido</p>
                <p className="text-sm mt-1"><strong>Solução:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Elimine backups antigos</li>
                  <li>Faça upgrade para um plano com mais armazenamento</li>
                </ul>
              </div>

              <div className="border-l-4 border-amber-500 pl-4">
                <h4 className="font-semibold">⚠️ Problemas de Conectividade</h4>
                <p className="text-sm mt-2"><strong>Causa:</strong> Internet instável ou serviço offline</p>
                <p className="text-sm mt-1"><strong>Solução:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Verifique a conexão à internet</li>
                  <li>O add-on tentará automaticamente mais tarde</li>
                  <li>Verifique o status do serviço HomeSafe</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-10">Como Obter Ajuda</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Consulte os logs do add-on para mensagens de erro detalhadas</li>
              <li>Abra um issue no <a href="https://github.com/avenseElectro/home-assist-guard/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a></li>
              <li>Entre em contacto através da <Link to="/contact" className="text-primary hover:underline">página de contacto</Link></li>
            </ul>
          </DocsSection>

          {/* Planos e Limites */}
          <DocsSection id="planos" title="Planos e Limites">
            <p>Escolha o plano que melhor se adequa às suas necessidades:</p>

            <div className="overflow-x-auto mt-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 font-semibold">Funcionalidade</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold">Pro</th>
                    <th className="text-center p-4 font-semibold">Business</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-4">Número de Backups</td>
                    <td className="text-center p-4">3</td>
                    <td className="text-center p-4">10</td>
                    <td className="text-center p-4">50</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4">Armazenamento Total</td>
                    <td className="text-center p-4">1 GB</td>
                    <td className="text-center p-4">10 GB</td>
                    <td className="text-center p-4">100 GB</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4">Tamanho Máx. por Backup</td>
                    <td className="text-center p-4">1 GB</td>
                    <td className="text-center p-4">5 GB</td>
                    <td className="text-center p-4">20 GB</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4">Retenção de Dados</td>
                    <td className="text-center p-4">7 dias</td>
                    <td className="text-center p-4">30 dias</td>
                    <td className="text-center p-4">90 dias</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4">Backups Automáticos</td>
                    <td className="text-center p-4">✅</td>
                    <td className="text-center p-4">✅</td>
                    <td className="text-center p-4">✅</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4">Encriptação AES-256</td>
                    <td className="text-center p-4">✅</td>
                    <td className="text-center p-4">✅</td>
                    <td className="text-center p-4">✅</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4">Suporte</td>
                    <td className="text-center p-4">Comunidade</td>
                    <td className="text-center p-4">Email</td>
                    <td className="text-center p-4">Prioritário</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Preço</td>
                    <td className="text-center p-4 font-semibold text-primary">Grátis</td>
                    <td className="text-center p-4 font-semibold text-primary">€4.99/mês</td>
                    <td className="text-center p-4 font-semibold text-primary">€14.99/mês</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center mt-8">
              <Button asChild size="lg" variant="hero">
                <Link to="/pricing">Ver Todos os Planos →</Link>
              </Button>
            </div>
          </DocsSection>

          {/* API Reference */}
          <DocsSection id="api" title="API Reference">
            <p>
              O HomeSafe expõe uma REST API para integração programática. 
              Consulte a <Link to="/api" className="text-primary hover:underline">documentação completa da API</Link> para mais detalhes.
            </p>

            <h3 className="text-xl font-semibold mt-8">Endpoints Principais</h3>

            <div className="space-y-6 mt-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">POST</span>
                  <code className="text-sm">/backup-upload</code>
                </div>
                <p className="text-sm mb-3">Upload de um novo backup (multipart chunked)</p>
                <CodeBlock 
                  code={`# Inicializar upload
curl -X POST https://iagsshcczgmjdrdweirb.supabase.co/functions/v1/backup-upload?action=init \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"file_size": 1048576, "ha_version": "2024.1.0"}'`}
                />
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs font-semibold">GET</span>
                  <code className="text-sm">/backup-list</code>
                </div>
                <p className="text-sm mb-3">Listar todos os backups</p>
                <CodeBlock 
                  code={`curl https://iagsshcczgmjdrdweirb.supabase.co/functions/v1/backup-list \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`}
                />
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs font-semibold">POST</span>
                  <code className="text-sm">/backup-download</code>
                </div>
                <p className="text-sm mb-3">Download de um backup específico</p>
                <CodeBlock 
                  code={`curl -X POST https://iagsshcczgmjdrdweirb.supabase.co/functions/v1/backup-download \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"backupId": "uuid-do-backup"}' \\
  -o backup.tar`}
                />
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs font-semibold">POST</span>
                  <code className="text-sm">/backup-delete</code>
                </div>
                <p className="text-sm mb-3">Eliminar um backup</p>
                <CodeBlock 
                  code={`curl -X POST https://iagsshcczgmjdrdweirb.supabase.co/functions/v1/backup-delete \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"backupId": "uuid-do-backup"}'`}
                />
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8">Autenticação</h3>
            <p>As requisições do add-on usam o header <code className="text-sm bg-muted px-2 py-1 rounded">x-api-key</code>. Para requisições da web, use o token de sessão no header <code className="text-sm bg-muted px-2 py-1 rounded">Authorization</code>:</p>
            <CodeBlock code='x-api-key: YOUR_API_KEY' />

            <h3 className="text-xl font-semibold mt-8">Rate Limits</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Free:</strong> 100 requests/hora</li>
              <li><strong>Pro:</strong> 1000 requests/hora</li>
              <li><strong>Business:</strong> 10000 requests/hora</li>
            </ul>
          </DocsSection>

          {/* FAQ */}
          <DocsSection id="faq" title="FAQ - Perguntas Frequentes">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">📌 Os meus dados estão seguros?</h4>
                <p className="text-sm">
                  Sim! Todos os backups são encriptados com AES-256 antes de serem enviados para a cloud. 
                  Apenas você tem acesso aos seus dados através da sua API Key.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📌 Posso usar o HomeSafe com Home Assistant Core?</h4>
                <p className="text-sm">
                  O add-on requer Supervisor (disponível no Home Assistant OS e Container). 
                  Para Home Assistant Core, pode usar a API diretamente com scripts personalizados.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📌 O que acontece se ultrapassar os limites do plano?</h4>
                <p className="text-sm">
                  O add-on irá notificá-lo e parar de criar novos backups até que elimine backups antigos 
                  ou faça upgrade do plano. Os backups existentes permanecem acessíveis.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📌 Posso cancelar a qualquer momento?</h4>
                <p className="text-sm">
                  Sim! Não há contratos de permanência. Pode cancelar a qualquer momento através do dashboard. 
                  O plano gratuito está sempre disponível.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📌 Como faço upgrade do plano?</h4>
                <p className="text-sm">
                  Aceda ao dashboard, vá para Settings → Subscription e selecione o novo plano. 
                  A mudança é instantânea e proporcional ao tempo restante.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📌 Onde são armazenados os backups?</h4>
                <p className="text-sm">
                  Os backups são armazenados em servidores cloud seguros na Europa (GDPR compliant) 
                  com redundância e encriptação em repouso.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📌 Posso partilhar a API Key com outros?</h4>
                <p className="text-sm">
                  Não é recomendado. A API Key garante acesso total aos seus backups. 
                  Mantenha-a privada e segura como uma palavra-passe.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📌 O add-on funciona offline?</h4>
                <p className="text-sm">
                  O add-on precisa de conexão à internet para enviar backups para a cloud. 
                  Se estiver offline, tentará novamente automaticamente quando a conexão for restaurada.
                </p>
              </div>
            </div>
          </DocsSection>

          {/* Call to Action Final */}
          <div className="text-center py-12 my-12 border-t border-border">
            <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Proteja o seu Home Assistant com backups automáticos e seguros
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" variant="hero">
                <Link to="/auth">Criar Conta Grátis</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a 
                  href="https://github.com/avenseElectro/home-assist-guard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Ver no GitHub
                </a>
              </Button>
            </div>
          </div>
        </DocsLayout>
      </div>
      <Footer />
    </div>
  );
}
