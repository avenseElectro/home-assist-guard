import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-backup.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

export function Hero() {
  const { t } = useLanguage();
  
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
          {t('hero.title')}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('hero.titleHighlight')}</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild variant="hero" size="xl">
            <Link to="/auth">{t('hero.cta')}</Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link to="/pricing">{t('hero.viewPlans')}</Link>
          </Button>
        </div>
        
        <div className="mt-16 flex justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>{t('hero.badge1')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>{t('hero.badge2')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>{t('hero.badge3')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
