import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Video, ListChecks, LogOut, ExternalLink, LayoutDashboard } from "lucide-react";
import logoPath from "@assets/psychicsource-logo_1773022542325.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { portalFetch } from "@/lib/portal-api";
import type { VideoRequest } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface PortalLayoutProps {
  children: React.ReactNode;
  psychicName?: string;
  onLogout?: () => void;
}

export function PortalLayout({ children, psychicName, onLogout }: PortalLayoutProps) {
  const [location] = useLocation();

  const { data: myRequests } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/my-requests"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/my-requests");
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!psychicName,
  });

  const revisionCount = myRequests?.filter(r => r.status === "revision_requested").length ?? 0;

  if (!psychicName) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  const portalNavItems = [
    {
      title: "Dashboard",
      url: "/portal",
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      title: "Available Requests",
      url: "/portal/requests",
      icon: Video,
      badge: 0,
    },
    {
      title: "My Requests",
      url: "/portal/my-requests",
      icon: ListChecks,
      badge: revisionCount,
    },
  ];

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex flex-col items-center gap-2">
              <img src={logoPath} alt="Psychic Source" className="w-full object-contain" data-testid="img-portal-logo" />
              <span className="text-xs text-muted-foreground">{psychicName}</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Video Requests</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {portalNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location === item.url ||
                          (item.url === "/portal" && location === "/portal") ||
                          (item.url === "/portal/my-requests" && location.startsWith("/portal/request/"))
                        }
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.title}</span>
                          {item.badge > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white" data-testid={`badge-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 space-y-2">
            <div className="flex flex-col gap-1">
              <a
                href="https://www.psychicsource.com/code-of-ethics"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <ExternalLink className="h-3 w-3" />
                Code of Ethics
              </a>
              <a
                href="https://www.psychicsource.com/customer-care/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <ExternalLink className="h-3 w-3" />
                Terms
              </a>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={onLogout}
              data-testid="button-portal-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger data-testid="button-portal-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
