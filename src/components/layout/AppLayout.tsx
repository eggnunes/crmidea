import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { FollowUpSettingsDialog } from "@/components/FollowUpSettingsDialog";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <main 
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6">
          <div className="flex justify-end gap-2 mb-4">
            <FollowUpSettingsDialog />
            <NotificationBell />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
