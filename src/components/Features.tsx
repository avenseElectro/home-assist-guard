import iconBackup from "@/assets/icon-backup.png";
import iconRestore from "@/assets/icon-restore.png";
import iconSecurity from "@/assets/icon-security.png";

const features = [
  {
    icon: iconBackup,
    title: "Backups Automáticos",
    description: "Configure backups automáticos diários, semanais ou mensais da sua configuração do Home Assistant."
  },
  {
    icon: iconRestore,
    title: "Restauro Rápido",
    description: "Restaure a sua configuração em segundos com um simples clique. Mantém histórico completo de versões."
  },
  {
    icon: iconSecurity,
    title: "Segurança Total",
    description: "Dados encriptados em repouso e em trânsito. Armazenamento S3-compatible redundante e confiável."
  }
];

export function Features() {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4">Tudo o que Precisa</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Proteção completa para a sua configuração do Home Assistant
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-smooth"
            >
              <div className="w-16 h-16 mb-6 rounded-lg gradient-primary flex items-center justify-center">
                <img src={feature.icon} alt={feature.title} className="w-10 h-10" />
              </div>
              <h3 className="text-2xl mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
