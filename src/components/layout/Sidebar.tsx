import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Package,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Settings,
  ShieldCheck,
  BarChart3,
  MessageCircle,
  Bell,
  UserCheck,
  Calendar,
  TrendingUp,
  Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const commercialItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/leads", icon: Users, label: "Leads" },
  { to: "/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/produtos", icon: Package, label: "Produtos" },
];

const postSaleItems = [
  { to: "/clientes", icon: UserCheck, label: "Clientes" },
  { to: "/calendario", icon: Calendar, label: "Calendário" },
];

const operationalItems = [
  { to: "/integracoes", icon: BarChart3, label: "Integrações" },
  { to: "/whatsapp", icon: MessageCircle, label: "Central de Atendimento" },
  { to: "/alertas", icon: Bell, label: "Central de Alertas" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

const adminItems = [
  { to: "/admin/usuarios", icon: ShieldCheck, label: "Usuários" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const { unreadCount } = useUnreadMessages();

  const renderNavItems = (items: typeof commercialItems) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const isWhatsApp = item.to === "/whatsapp";
        const showBadge = isWhatsApp && unreadCount > 0;
        
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors relative",
                collapsed && "justify-center px-2"
              )}
              activeClassName="bg-sidebar-accent text-foreground"
            >
              <div className="relative">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {showBadge && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="font-medium flex-1">{item.label}</span>
                  {showBadge && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 min-w-5 px-1.5 text-xs font-bold animate-pulse"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  const renderSectionLabel = (label: string, icon: React.ElementType) => {
    if (collapsed) return null;
    const Icon = icon;
    return (
      <div className="flex items-center gap-2 px-3 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
    );
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-foreground whitespace-nowrap">CRM IDEA</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {/* Comercial Section */}
        <div className="mb-6">
          {renderSectionLabel("Comercial", TrendingUp)}
          {renderNavItems(commercialItems)}
        </div>

        {/* Pós-Venda Section */}
        <div className="mb-6">
          {renderSectionLabel("Pós-Venda", Headphones)}
          {renderNavItems(postSaleItems)}
        </div>

        {/* Operacional Section */}
        <div className="mb-6">
          {renderSectionLabel("Operacional", Settings)}
          {renderNavItems(operationalItems)}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            {renderSectionLabel("Admin", ShieldCheck)}
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors",
                      collapsed && "justify-center px-2"
                    )}
                    activeClassName="bg-sidebar-accent text-foreground"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0 text-red-400" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="text-xs text-muted-foreground mb-3">
            <p className="font-medium text-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={signOut}
          className={cn(
            "text-muted-foreground hover:text-destructive w-full",
            collapsed ? "justify-center" : "justify-start gap-2"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
