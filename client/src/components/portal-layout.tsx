import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Video, ListChecks, User, LogOut } from "lucide-react";

interface PortalLayoutProps {
  children: React.ReactNode;
  psychicName?: string;
  onLogout?: () => void;
}

export function PortalLayout({ children, psychicName, onLogout }: PortalLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/portal/requests", label: "Available Requests", icon: Video },
    { href: "/portal/my-requests", label: "My Requests", icon: ListChecks },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between gap-4 h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/portal">
            <span className="font-semibold text-lg cursor-pointer" data-testid="link-portal-home">Psychic Portal</span>
          </Link>
          {psychicName && (
            <nav className="flex items-center gap-1 flex-wrap">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    size="sm"
                    className="toggle-elevate"
                    data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {psychicName && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span data-testid="text-psychic-name">{psychicName}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} data-testid="button-portal-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
