import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Bell, Key, Webhook, Link as LinkIcon, Book, Home, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  icon: React.ReactNode;
}

interface DashboardNavbarProps {
  alertCount?: number;
  alerts?: Alert[];
  isAdmin?: boolean;
}

export function DashboardNavbar({ alertCount = 0, alerts = [], isAdmin = false }: DashboardNavbarProps) {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const activeAlerts = alerts.filter(a => a.type !== 'success');

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
          {isAdmin && (
            <Badge variant="destructive" className="font-semibold">
              ADMIN
            </Badge>
          )}
          {alertCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                  >
                    {alertCount}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Alertas Ativos ({alertCount})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {activeAlerts.slice(0, 5).map((alert) => (
                  <DropdownMenuItem key={alert.id} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5">{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{alert.title}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" asChild size="sm">
            <Link to="/docs" title="Documentação">
              <Book className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link to="/lovelace-guide" title="Lovelace Guide">
              <Home className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link to="/api-keys" title="API Keys">
              <Key className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link to="/webhooks" title="Webhooks">
              <Webhook className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link to="/integrations" title="Integrations">
              <LinkIcon className="w-4 h-4" />
            </Link>
          </Button>
          <LanguageSwitcher />
          <Button variant="ghost" onClick={signOut} size="sm" className="gap-2">
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </div>
    </nav>
  );
}
