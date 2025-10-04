import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Bell, Key, Webhook } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface DashboardNavbarProps {
  alertCount?: number;
}

export function DashboardNavbar({ alertCount = 0 }: DashboardNavbarProps) {
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
          {alertCount > 0 && (
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                >
                  {alertCount}
                </Badge>
              </Button>
            </Link>
          )}
          <Button variant="ghost" asChild>
            <Link to="/api-keys">
              <Key className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/webhooks">
              <Webhook className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
}
