import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Heart, Zap, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6">Sobre o HomeSafe Backup</h1>
              <p className="text-xl text-muted-foreground">
                Protegendo o coração da sua casa inteligente desde 2024
              </p>
            </div>

            {/* Missão */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">A Nossa Missão</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                O HomeSafe Backup nasceu da necessidade de proteger milhares de horas de configuração 
                e automação do Home Assistant. Sabemos o quanto investiu para tornar a sua casa verdadeiramente 
                inteligente, e a nossa missão é garantir que esse trabalho nunca se perca.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Acreditamos que a segurança dos dados deve ser simples, acessível e automática. 
                Por isso criámos uma solução que funciona nos bastidores, protegendo o seu Home Assistant 
                sem que tenha de pensar nisso.
              </p>
            </section>

            {/* Valores */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Os Nossos Valores</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-card border border-border">
                  <Shield className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Segurança em Primeiro</h3>
                  <p className="text-muted-foreground">
                    Encriptação de ponta a ponta, armazenamento seguro e conformidade com GDPR. 
                    Os seus dados são sagrados.
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card border border-border">
                  <Zap className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Simplicidade</h3>
                  <p className="text-muted-foreground">
                    Instale, configure e esqueça. Os backups acontecem automaticamente, 
                    sem complicações ou configurações complexas.
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card border border-border">
                  <Heart className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Comunidade</h3>
                  <p className="text-muted-foreground">
                    Construído por utilizadores de Home Assistant, para utilizadores de Home Assistant. 
                    Ouvimos a comunidade e melhoramos constantemente.
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card border border-border">
                  <Users className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Transparência</h3>
                  <p className="text-muted-foreground">
                    Código open-source, preços claros e comunicação honesta. 
                    Sem surpresas, sem letras pequenas.
                  </p>
                </div>
              </div>
            </section>

            {/* Tecnologia */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Tecnologia</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                O HomeSafe Backup é construído com tecnologias modernas e confiáveis:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li><strong>Python</strong> - Core do add-on Home Assistant</li>
                <li><strong>React + TypeScript</strong> - Interface web moderna e responsiva</li>
                <li><strong>Supabase</strong> - Backend seguro e escalável</li>
                <li><strong>AES-256</strong> - Encriptação de nível militar</li>
                <li><strong>Cloud Storage</strong> - Infraestrutura redundante na Europa</li>
              </ul>
            </section>

            {/* Open Source */}
            <section className="mb-16 p-8 rounded-lg bg-card border border-border">
              <h2 className="text-3xl font-bold mb-4">Open Source</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Acreditamos no poder do código aberto. O add-on HomeSafe Backup está disponível no GitHub 
                para que possa auditar, contribuir e adaptar às suas necessidades.
              </p>
              <a 
                href="https://github.com/avenseElectro/home-assist-guard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                Ver no GitHub →
              </a>
            </section>

            {/* Equipa */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Equipa</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Somos uma equipa pequena mas dedicada de entusiastas de home automation e engenheiros de software. 
                O nosso objectivo é criar ferramentas que tornem a vida dos utilizadores de Home Assistant 
                mais fácil e segura. Se quiser entrar em contacto, estamos sempre disponíveis!
              </p>
            </section>

            {/* CTA */}
            <section className="text-center py-12 rounded-lg bg-gradient-primary text-primary-foreground">
              <h2 className="text-3xl font-bold mb-4">Junte-se a Nós</h2>
              <p className="text-lg mb-6 opacity-90">
                Milhares de utilizadores já protegem o seu Home Assistant com HomeSafe
              </p>
              <div className="flex gap-4 justify-center">
                <a 
                  href="/auth"
                  className="px-8 py-3 bg-background text-foreground rounded-lg font-semibold hover:bg-background/90 transition-smooth"
                >
                  Começar Grátis
                </a>
                <a 
                  href="/docs"
                  className="px-8 py-3 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition-smooth"
                >
                  Ver Documentação
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
