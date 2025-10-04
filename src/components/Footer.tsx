import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="gradient-primary p-2 rounded-lg">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>HomeSafe</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/pricing" className="hover:text-foreground transition-smooth">{t('footer.pricing')}</Link></li>
              <li><Link to="/docs" className="hover:text-foreground transition-smooth">{t('footer.docs')}</Link></li>
              <li><Link to="/api" className="hover:text-foreground transition-smooth">{t('footer.api')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-smooth">{t('footer.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-smooth">{t('footer.contact')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-smooth">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-smooth">{t('footer.terms')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 HomeSafe Backup. {t('footer.rights')}</p>
          <p className="mt-2 flex items-center justify-center gap-1">
            Built with <span className="text-primary font-semibold">HomeSafe</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
