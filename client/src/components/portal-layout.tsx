import { Link, useLocation } from "wouter";
import { Video, ListChecks, LogOut } from "lucide-react";
import logoPath from "@assets/psychicsource-logo-nobg.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
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

const portalNavItems = [
  {
    title: "Available Requests",
    url: "/portal/requests",
    icon: Video,
  },
  {
    title: "My Requests",
    url: "/portal/my-requests",
    icon: ListChecks,
  },
];

export function PortalLayout({ children, psychicName, onLogout }: PortalLayoutProps) {
  const [location] = useLocation();

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

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <img src={logoPath} alt="Psychic Source" className="h-10 object-contain" data-testid="img-portal-logo" />
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
                        isActive={location === item.url || (item.url === "/portal/requests" && location === "/portal") || (item.url === "/portal/my-requests" && location.startsWith("/portal/request/"))}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
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
