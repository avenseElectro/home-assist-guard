import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-backup.jpg";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(220, 225, 237, 0.9), rgba(220, 225, 237, 0.95)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container relative z-10 px-4 py-20 mx-auto text-center">
        <h1 className="text-5xl md:text-7xl mb-6 max-w-4xl mx-auto">
          Backups Seguros para o Seu
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Home Assistant</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Crie, armazene e restaure backups da sua configuração com total segurança e facilidade.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild variant="hero" size="xl">
            <Link to="/auth">Começar Grátis</Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link to="/pricing">Ver Planos</Link>
          </Button>
        </div>
        
        <div className="mt-16 flex justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>7 dias grátis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </section>
  );
}
