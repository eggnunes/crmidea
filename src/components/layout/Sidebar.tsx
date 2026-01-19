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
  Headphones,
  CheckCheck,
  GraduationCap,
  Mail,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const commercialItems = [
  { to: "/metodo-idea", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/metodo-idea/leads", icon: Users, label: "Leads" },
  { to: "/metodo-idea/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/metodo-idea/produtos", icon: Package, label: "Produtos" },
];

const postSaleItems = [
  { to: "/metodo-idea/clientes", icon: UserCheck, label: "Clientes" },
  { to: "/metodo-idea/consultoria", icon: GraduationCap, label: "Consultoria" },
  { to: "/metodo-idea/calendario", icon: Calendar, label: "Calendário" },
];

const operationalItems = [
  { to: "/metodo-idea/integracoes", icon: BarChart3, label: "Integrações" },
  { to: "/metodo-idea/whatsapp", icon: MessageCircle, label: "Central de Atendimento" },
  { to: "/metodo-idea/emails", icon: Mail, label: "Central de Emails" },
  { to: "/metodo-idea/campanhas", icon: Megaphone, label: "Campanhas" },
  { to: "/metodo-idea/alertas", icon: Bell, label: "Central de Alertas" },
  { to: "/metodo-idea/configuracoes", icon: Settings, label: "Configurações" },
];

const adminItems = [
  { to: "/metodo-idea/admin/usuarios", icon: ShieldCheck, label: "Usuários" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const { unreadCount, refetch } = useUnreadMessages();

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('user_id', user.id)
        .gt('unread_count', 0);

      if (error) throw error;
      
      await refetch();
      toast.success('Todas as mensagens foram marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erro ao marcar mensagens como lidas');
    }
  };

  const renderNavItems = (items: typeof commercialItems) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const isWhatsApp = item.to === "/whatsapp";
        const showBadge = isWhatsApp && unreadCount > 0;
        
        const navContent = (
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
        );

        // Wrap WhatsApp item with context menu
        if (isWhatsApp) {
          return (
            <li key={item.to}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  {navContent}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem 
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="gap-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Marcar todas como lidas
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          );
        }
        
        return (
          <li key={item.to}>
            {navContent}
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
