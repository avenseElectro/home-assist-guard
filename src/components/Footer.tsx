import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function Footer() {
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
              Backups seguros para o seu Home Assistant
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Produto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/pricing" className="hover:text-foreground transition-smooth">Preços</Link></li>
              <li><Link to="/docs" className="hover:text-foreground transition-smooth">Documentação</Link></li>
              <li><Link to="/api" className="hover:text-foreground transition-smooth">API</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-smooth">Sobre</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-smooth">Contacto</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-smooth">Privacidade</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-smooth">Termos</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 HomeSafe Backup. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
