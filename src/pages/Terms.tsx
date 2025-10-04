import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">Termos e Condições</h1>
            <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-PT')}</p>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">1. Aceitação dos Termos</h2>
                  <p className="text-muted-foreground">
                    Ao aceder e utilizar o HomeSafe Backup ("Serviço"), você concorda em ficar vinculado a estes 
                    Termos e Condições. Se não concordar com qualquer parte destes termos, não deverá utilizar o Serviço.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">2. Descrição do Serviço</h2>
                  <p className="text-muted-foreground mb-3">
                    O HomeSafe Backup é uma plataforma de backup automático para Home Assistant que oferece:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Backups automáticos agendados</li>
                    <li>Armazenamento seguro encriptado</li>
                    <li>Gestão de backups via dashboard web</li>
                    <li>API REST para integração</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">3. Conta de Utilizador</h2>
                  <p className="text-muted-foreground mb-3">
                    Para utilizar o Serviço, você deve:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Criar uma conta fornecendo informações precisas e completas</li>
                    <li>Manter a segurança da sua conta e senha</li>
                    <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                    <li>Ser responsável por todas as atividades realizadas na sua conta</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">4. Planos e Pagamentos</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>4.1 Planos Disponíveis:</strong> Oferecemos planos Free, Pro e Business com diferentes 
                      limites de armazenamento e funcionalidades.
                    </p>
                    <p>
                      <strong>4.2 Faturação:</strong> Os planos pagos são faturados mensalmente ou anualmente, conforme 
                      selecionado. Os pagamentos são processados de forma segura através de processadores de pagamento terceiros.
                    </p>
                    <p>
                      <strong>4.3 Reembolsos:</strong> Oferecemos reembolso total dentro de 14 dias após a compra inicial. 
                      Após este período, não são oferecidos reembolsos proporcionais.
                    </p>
                    <p>
                      <strong>4.4 Cancelamento:</strong> Pode cancelar a sua subscrição a qualquer momento. O acesso ao 
                      serviço continuará até ao final do período de faturação pago.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">5. Uso Aceitável</h2>
                  <p className="text-muted-foreground mb-3">
                    Você concorda em não:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Usar o Serviço para qualquer propósito ilegal ou não autorizado</li>
                    <li>Tentar obter acesso não autorizado a qualquer parte do Serviço</li>
                    <li>Interferir ou interromper o Serviço ou servidores</li>
                    <li>Fazer upload de conteúdo malicioso, vírus ou código prejudicial</li>
                    <li>Violar direitos de propriedade intelectual</li>
                    <li>Usar o Serviço para spam ou distribuição de conteúdo não solicitado</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">6. Dados e Backups</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>6.1 Propriedade:</strong> Você mantém todos os direitos sobre os seus dados e backups.
                    </p>
                    <p>
                      <strong>6.2 Segurança:</strong> Implementamos medidas de segurança para proteger os seus dados, 
                      incluindo encriptação em trânsito e em repouso.
                    </p>
                    <p>
                      <strong>6.3 Retenção:</strong> Os backups são retidos de acordo com o seu plano. Após o cancelamento 
                      da conta, os dados podem ser eliminados após 30 dias.
                    </p>
                    <p>
                      <strong>6.4 Responsabilidade:</strong> Embora nos esforcemos pela máxima confiabilidade, você é 
                      responsável por manter backups adicionais dos seus dados críticos.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">7. Garantias e Limitação de Responsabilidade</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>7.1 Sem Garantias:</strong> O Serviço é fornecido "como está" sem garantias de qualquer tipo.
                    </p>
                    <p>
                      <strong>7.2 Limitação:</strong> Em nenhuma circunstância seremos responsáveis por danos indiretos, 
                      incidentais, especiais ou consequenciais resultantes do uso ou incapacidade de usar o Serviço.
                    </p>
                    <p>
                      <strong>7.3 Limite Máximo:</strong> Nossa responsabilidade total não excederá o valor pago por você 
                      nos últimos 12 meses.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">8. Propriedade Intelectual</h2>
                  <p className="text-muted-foreground">
                    O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade 
                    exclusiva do HomeSafe e seus licenciadores. O Serviço é protegido por direitos autorais, marcas 
                    registradas e outras leis.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">9. Modificações do Serviço</h2>
                  <p className="text-muted-foreground">
                    Reservamo-nos o direito de modificar ou descontinuar, temporária ou permanentemente, o Serviço 
                    (ou qualquer parte dele) com ou sem aviso prévio. Não seremos responsáveis perante você ou 
                    terceiros por qualquer modificação, suspensão ou descontinuação do Serviço.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">10. Alterações aos Termos</h2>
                  <p className="text-muted-foreground">
                    Podemos atualizar estes Termos periodicamente. Notificaremos você sobre alterações significativas 
                    por email ou através de um aviso no Serviço. O uso continuado após as alterações constitui aceitação 
                    dos novos Termos.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">11. Lei Aplicável</h2>
                  <p className="text-muted-foreground">
                    Estes Termos são regidos pelas leis de Portugal. Qualquer disputa será resolvida nos tribunais 
                    competentes de Portugal.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">12. Contacto</h2>
                  <p className="text-muted-foreground">
                    Para questões sobre estes Termos, contacte-nos em: <br />
                    <a href="mailto:support@homesafe.com" className="text-primary hover:underline">
                      support@homesafe.com
                    </a>
                  </p>
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
