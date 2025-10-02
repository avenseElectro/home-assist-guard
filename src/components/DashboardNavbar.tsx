import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function DashboardNavbar() {
  const { signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div className="gradient-primary p-2 rounded-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>HomeSafe Backup</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
}
