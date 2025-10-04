import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export function Navbar() {
  const { t } = useLanguage();
  
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="gradient-primary p-2 rounded-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>HomeSafe Backup</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
            {t('nav.pricing')}
          </Link>
          <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-smooth">
            {t('nav.docs')}
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button asChild variant="ghost">
            <Link to="/auth">{t('nav.login')}</Link>
          </Button>
          <Button asChild variant="default">
            <Link to="/auth">{t('nav.register')}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
