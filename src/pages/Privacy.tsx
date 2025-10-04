import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">Política de Privacidade</h1>
            <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-PT')}</p>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">1. Introdução</h2>
                  <p className="text-muted-foreground">
                    A HomeSafe ("nós", "nosso") está comprometida em proteger a sua privacidade. Esta Política de 
                    Privacidade explica como coletamos, usamos, divulgamos e protegemos as suas informações quando 
                    você utiliza o nosso serviço de backup para Home Assistant.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">2. Informações que Coletamos</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">2.1 Informações de Conta</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                        <li>Nome e endereço de email</li>
                        <li>Informações de pagamento (processadas por terceiros)</li>
                        <li>Preferências de conta e configurações</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-2">2.2 Dados de Backup</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                        <li>Snapshots do Home Assistant (encriptados)</li>
                        <li>Metadados de backup (data, tamanho, nome)</li>
                        <li>Logs de operações de backup</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-2">2.3 Dados de Uso</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                        <li>Endereço IP e localização geográfica</li>
                        <li>Informações do navegador e dispositivo</li>
                        <li>Atividade na plataforma e interações</li>
                        <li>Dados de desempenho e diagnóstico</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-2">2.4 Cookies e Tecnologias Similares</h3>
                      <p className="text-muted-foreground">
                        Utilizamos cookies essenciais para autenticação e funcionalidade do serviço. Não utilizamos 
                        cookies de rastreamento publicitário.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">3. Como Usamos Suas Informações</h2>
                  <p className="text-muted-foreground mb-3">
                    Usamos as informações coletadas para:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Fornecer, operar e manter o serviço de backup</li>
                    <li>Processar e gerenciar backups automáticos e manuais</li>
                    <li>Autenticar e autorizar o acesso à sua conta</li>
                    <li>Processar pagamentos e gerenciar subscrições</li>
                    <li>Enviar notificações sobre o serviço e atualizações importantes</li>
                    <li>Responder a solicitações de suporte e comunicações</li>
                    <li>Melhorar e otimizar o desempenho do serviço</li>
                    <li>Detectar e prevenir fraudes e abusos</li>
                    <li>Cumprir obrigações legais</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">4. Segurança dos Dados</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>4.1 Encriptação:</strong> Todos os backups são encriptados em trânsito (TLS) e em repouso 
                      (AES-256).
                    </p>
                    <p>
                      <strong>4.2 Acesso Restrito:</strong> O acesso aos dados é estritamente limitado a pessoal 
                      autorizado com necessidade legítima.
                    </p>
                    <p>
                      <strong>4.3 Infraestrutura Segura:</strong> Utilizamos provedores de cloud confiáveis com 
                      certificações de segurança (ISO 27001, SOC 2).
                    </p>
                    <p>
                      <strong>4.4 Monitorização:</strong> Implementamos monitorização contínua para detectar e responder 
                      a incidentes de segurança.
                    </p>
                    <p>
                      <strong>4.5 Backups:</strong> Mantemos backups redundantes dos dados em múltiplas localizações 
                      geográficas.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">5. Compartilhamento de Dados</h2>
                  <p className="text-muted-foreground mb-3">
                    Não vendemos as suas informações pessoais. Podemos compartilhar dados limitados com:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Processadores de Pagamento:</strong> Para processar transações (Stripe, PayPal)</li>
                    <li><strong>Provedores de Cloud:</strong> Para armazenamento e infraestrutura</li>
                    <li><strong>Ferramentas de Análise:</strong> Para métricas agregadas e anónimas</li>
                    <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou ordem judicial</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">6. Seus Direitos (RGPD)</h2>
                  <p className="text-muted-foreground mb-3">
                    De acordo com o Regulamento Geral de Proteção de Dados (RGPD), você tem direito a:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
                    <li><strong>Retificação:</strong> Corrigir dados imprecisos ou incompletos</li>
                    <li><strong>Eliminação:</strong> Solicitar a eliminação dos seus dados ("direito ao esquecimento")</li>
                    <li><strong>Portabilidade:</strong> Receber os seus dados em formato estruturado</li>
                    <li><strong>Oposição:</strong> Opor-se ao processamento dos seus dados</li>
                    <li><strong>Restrição:</strong> Solicitar restrição do processamento</li>
                    <li><strong>Reclamação:</strong> Apresentar reclamação à autoridade de proteção de dados</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    Para exercer estes direitos, contacte-nos em{" "}
                    <a href="mailto:privacy@homesafe.com" className="text-primary hover:underline">
                      privacy@homesafe.com
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">7. Retenção de Dados</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>7.1 Dados de Conta:</strong> Mantidos enquanto a conta estiver ativa e por até 12 meses 
                      após cancelamento para fins legais e contabilísticos.
                    </p>
                    <p>
                      <strong>7.2 Backups:</strong> Retidos de acordo com o plano selecionado (7, 30 ou 90 dias). 
                      Após o cancelamento, os backups são eliminados após 30 dias.
                    </p>
                    <p>
                      <strong>7.3 Logs:</strong> Logs de sistema são mantidos por 90 dias para fins de segurança e debugging.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">8. Transferências Internacionais</h2>
                  <p className="text-muted-foreground">
                    Os seus dados podem ser transferidos e armazenados em servidores localizados fora do seu país de 
                    residência. Garantimos que estas transferências cumprem os requisitos do RGPD através de cláusulas 
                    contratuais padrão e certificações adequadas.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">9. Menores de Idade</h2>
                  <p className="text-muted-foreground">
                    O nosso serviço não se destina a menores de 16 anos. Não coletamos intencionalmente informações 
                    pessoais de crianças. Se descobrirmos que coletamos dados de um menor, eliminaremos essas informações 
                    imediatamente.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">10. Violações de Dados</h2>
                  <p className="text-muted-foreground">
                    Em caso de violação de segurança que afete os seus dados pessoais, notificaremos você e as 
                    autoridades competentes dentro de 72 horas, conforme exigido pelo RGPD, fornecendo informações 
                    sobre a natureza da violação e as medidas tomadas.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">11. Alterações a Esta Política</h2>
                  <p className="text-muted-foreground">
                    Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações 
                    significativas por email e através de um aviso no serviço. A data da "Última atualização" no topo 
                    indica quando a política foi revisada pela última vez.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">12. Contacto</h2>
                  <div className="text-muted-foreground space-y-2">
                    <p>Para questões sobre esta Política de Privacidade ou exercer os seus direitos:</p>
                    <p>
                      <strong>Email:</strong>{" "}
                      <a href="mailto:privacy@homesafe.com" className="text-primary hover:underline">
                        privacy@homesafe.com
                      </a>
                    </p>
                    <p>
                      <strong>Encarregado de Proteção de Dados:</strong>{" "}
                      <a href="mailto:dpo@homesafe.com" className="text-primary hover:underline">
                        dpo@homesafe.com
                      </a>
                    </p>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
