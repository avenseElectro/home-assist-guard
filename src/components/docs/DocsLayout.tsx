import { Link, useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Download, 
  Settings, 
  Play, 
  Database, 
  AlertCircle, 
  CreditCard, 
  Code, 
  HelpCircle 
} from "lucide-react";

interface DocsSidebarItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

const sidebarItems: DocsSidebarItem[] = [
  { title: "Introdução", href: "#introducao", icon: <Home className="w-4 h-4" /> },
  { title: "Instalação", href: "#instalacao", icon: <Download className="w-4 h-4" /> },
  { title: "Configuração", href: "#configuracao", icon: <Settings className="w-4 h-4" /> },
  { title: "Utilização", href: "#utilizacao", icon: <Play className="w-4 h-4" /> },
  { title: "🎯 Smart Scheduling", href: "#smart-scheduling" },
  { title: "🔗 Webhooks", href: "#webhooks" },
  { title: "Gestão de Backups", href: "#gestao", icon: <Database className="w-4 h-4" /> },
  { title: "Troubleshooting", href: "#troubleshooting", icon: <AlertCircle className="w-4 h-4" /> },
  { title: "Planos e Limites", href: "#planos", icon: <CreditCard className="w-4 h-4" /> },
  { title: "API Reference", href: "#api", icon: <Code className="w-4 h-4" /> },
  { title: "FAQ", href: "#faq", icon: <HelpCircle className="w-4 h-4" /> },
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentHash = location.hash || "#introducao";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Documentação</h2>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-smooth",
                      currentHash === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </a>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
