import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function Navbar() {
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
            Preços
          </Link>
          <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-smooth">
            Documentação
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild variant="default">
            <Link to="/auth">Começar</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
