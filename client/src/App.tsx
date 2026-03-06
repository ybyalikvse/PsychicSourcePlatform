import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAnalytics } from "@/hooks/use-analytics";
import { PortalLayout } from "@/components/portal-layout";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { Psychic } from "@shared/schema";

import Dashboard from "@/pages/dashboard";
import Content from "@/pages/content";
import Create from "@/pages/create";
import BulkCreate from "@/pages/bulk-create";
import Performance from "@/pages/performance";
import Analytics from "@/pages/analytics";
import Integrations from "@/pages/integrations";
import Optimize from "@/pages/optimize";
import InternalLinks from "@/pages/internal-links";
import Settings from "@/pages/settings";
import Horoscopes from "@/pages/horoscopes";
import Psychics from "@/pages/psychics";
import VideoRequests from "@/pages/video-requests";
import PortalLogin from "@/pages/portal/portal-login";
import PortalRequestsPage from "@/pages/portal/portal-requests";
import PortalMyRequestsPage from "@/pages/portal/portal-my-requests";
import NotFound from "@/pages/not-found";

function AdminRouter() {
  useAnalytics();

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/content" component={Content} />
      <Route path="/create" component={Create} />
      <Route path="/edit/:id" component={Create} />
      <Route path="/bulk-create" component={BulkCreate} />
      <Route path="/performance" component={Performance} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/optimize" component={Optimize} />
      <Route path="/internal-links" component={InternalLinks} />
      <Route path="/settings" component={Settings} />
      <Route path="/horoscopes" component={Horoscopes} />
      <Route path="/psychics" component={Psychics} />
      <Route path="/video-requests" component={VideoRequests} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PortalRouter() {
  const { user, loading: authLoading, logout: firebaseLogout } = useFirebaseAuth();
  const [psychic, setPsychic] = useState<Psychic | null>(() => {
    const stored = localStorage.getItem("portal_psychic");
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user && !psychic && !verifying) {
      setVerifying(true);
      user.getIdToken().then(async (idToken) => {
        try {
          const res = await apiRequest("POST", "/api/portal/auth/firebase", { idToken });
          const p: Psychic = await res.json();
          setPsychic(p);
          localStorage.setItem("portal_psychic", JSON.stringify(p));
        } catch {
          await firebaseLogout();
          localStorage.removeItem("portal_psychic");
        } finally {
          setVerifying(false);
        }
      });
    }
    if (!user && psychic) {
      setPsychic(null);
      localStorage.removeItem("portal_psychic");
    }
  }, [user]);

  const handleLogin = (p: Psychic) => {
    setPsychic(p);
    localStorage.setItem("portal_psychic", JSON.stringify(p));
  };

  const handleLogout = async () => {
    await firebaseLogout();
    setPsychic(null);
    localStorage.removeItem("portal_psychic");
  };

  if (authLoading || verifying) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PortalLayout>
    );
  }

  if (!psychic) {
    return <PortalLogin onLogin={handleLogin} />;
  }

  return (
    <PortalLayout psychicName={psychic.name} onLogout={handleLogout}>
      <Switch>
        <Route path="/portal/requests">
          <PortalRequestsPage psychic={psychic} />
        </Route>
        <Route path="/portal/my-requests">
          <PortalMyRequestsPage psychic={psychic} />
        </Route>
        <Route path="/portal">
          <PortalRequestsPage psychic={psychic} />
        </Route>
      </Switch>
    </PortalLayout>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <AdminRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [location] = useLocation();
  const isPortal = location.startsWith("/portal");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {isPortal ? <PortalRouter /> : <AppLayout />}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
