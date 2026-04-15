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
import { FirebaseAuthProvider, useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import LoginPage from "@/pages/login";
import ForgotPasswordPage from "@/pages/forgot-password";
import PortalRequestsPage from "@/pages/portal/portal-requests";
import PortalMyRequestsPage from "@/pages/portal/portal-my-requests";
import PortalRequestDetailPage from "@/pages/portal/portal-request-detail";
import PortalDashboardPage from "@/pages/portal/portal-dashboard";
import PortalHowItWorksPage from "@/pages/portal/portal-how-it-works";
import PortalProgramInfoPage from "@/pages/portal/portal-program-info";
import NotFound from "@/pages/not-found";
import VspContentCreator from "@/pages/vsp-content-creator";
import VspHistory from "@/pages/vsp-history";
import VspCalendar from "@/pages/vsp-calendar";
import VspSettings from "@/pages/vsp-settings";
import CiDashboard from "@/pages/ci-dashboard";
import CiCompetitors from "@/pages/ci-competitors";
import CiAnalyses from "@/pages/ci-analyses";
import CiBriefs from "@/pages/ci-briefs";
import CiSettingsPage from "@/pages/ci-settings";
import CiPerformance from "@/pages/ci-performance";
import SocialPosts from "@/pages/social-posts";
import SocialPostsCreate from "@/pages/social-posts-create";
import SocialPostsTemplates from "@/pages/social-posts-templates";
import SocialPostsCarouselTypes from "@/pages/social-posts-carousel-types";
import SocialPostsMedia from "@/pages/social-posts-media";

interface AuthInfo {
  uid: string;
  email: string;
  isAdmin: boolean;
  isPsychic: boolean;
  isPending: boolean;
  psychic: Psychic | null;
}

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
      <Route path="/psychics/:id" component={Psychics} />
      <Route path="/psychics" component={Psychics} />
      <Route path="/video-requests/:id" component={VideoRequests} />
      <Route path="/video-requests" component={VideoRequests} />
      <Route path="/vsp/:projectId" component={VspContentCreator} />
      <Route path="/vsp" component={VspContentCreator} />
      <Route path="/vsp/history" component={VspHistory} />
      <Route path="/vsp/calendar" component={VspCalendar} />
      <Route path="/vsp/settings" component={VspSettings} />
      <Route path="/ci" component={CiDashboard} />
      <Route path="/ci/competitors" component={CiCompetitors} />
      <Route path="/ci/analyses" component={CiAnalyses} />
      <Route path="/ci/briefs" component={CiBriefs} />
      <Route path="/ci/performance" component={CiPerformance} />
      <Route path="/ci/settings" component={CiSettingsPage} />
      <Route path="/social-posts/create" component={SocialPostsCreate} />
      <Route path="/social-posts/edit/:id" component={SocialPostsCreate} />
      <Route path="/social-posts/templates" component={SocialPostsTemplates} />
      <Route path="/social-posts/carousel-types" component={SocialPostsCarouselTypes} />
      <Route path="/social-posts/media-library" component={SocialPostsMedia} />
      <Route path="/social-posts" component={SocialPosts} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PortalView({ psychic, onLogout }: { psychic: Psychic; onLogout: () => void }) {
  return (
    <PortalLayout psychicName={psychic.name} onLogout={onLogout}>
      <Switch>
        <Route path="/portal/requests">
          <PortalRequestsPage psychic={psychic} />
        </Route>
        <Route path="/portal/my-requests">
          <PortalMyRequestsPage psychic={psychic} />
        </Route>
        <Route path="/portal/request/:id">
          {(params) => <PortalRequestDetailPage requestId={params.id} psychic={psychic} />}
        </Route>
        <Route path="/portal/how-it-works">
          <PortalHowItWorksPage />
        </Route>
        <Route path="/portal">
          <PortalProgramInfoPage psychic={psychic} />
        </Route>
      </Switch>
    </PortalLayout>
  );
}

function AppLayout({ onLogout, userEmail }: { onLogout: () => void; userEmail?: string }) {
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
            <div className="flex items-center gap-3">
              {userEmail && (
                <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-admin-email">
                  {userEmail}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                title="Sign out"
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <AdminRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function UnifiedAuthGate() {
  const { user, loading, logout } = useFirebaseAuth();
  const [location, setLocation] = useLocation();
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (pendingRedirect) {
      setLocation(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [pendingRedirect]);

  useEffect(() => {
    if (authInfo) {
      if (authInfo.isAdmin && !authInfo.isPsychic && location.startsWith("/portal")) {
        setLocation("/");
      } else if (authInfo.isPsychic && !authInfo.isAdmin && !location.startsWith("/portal")) {
        setLocation("/portal");
      }
    }
  }, [authInfo, location]);

  useEffect(() => {
    if (user && !authInfo && !checking && !needsRegistration) {
      setChecking(true);
      setAuthError(null);
      user.getIdToken().then(async (idToken) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          if (res.ok) {
            const data: AuthInfo = await res.json();
            handleAuthResponse(data, idToken);
          } else {
            const data = await res.json().catch(() => ({}));
            setAuthError(data.error || "Login failed.");
            await logout();
          }
        } catch {
          setAuthError("Login failed. Please try again.");
          await logout();
        } finally {
          setChecking(false);
        }
      });
    }
    if (!user) {
      setAuthInfo(null);
      setNeedsRegistration(false);
      setPendingIdToken(null);
    }
  }, [user]);

  const handleAuthResponse = (data: AuthInfo, idToken: string) => {
    if (data.isAdmin || data.isPsychic) {
      setAuthInfo(data);
    } else if (data.isPending) {
      setAuthError("Your account is pending admin approval. Please check back later.");
    } else {
      setPendingIdToken(idToken);
      setNeedsRegistration(true);
    }
  };

  const handleAuthenticated = async (idToken: string) => {
    setAuthError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        const data: AuthInfo = await res.json();
        handleAuthResponse(data, idToken);
      } else {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || "Login failed.");
        await logout();
      }
    } catch {
      setAuthError("Login failed. Please try again.");
      await logout();
    } finally {
      setChecking(false);
    }
  };

  const handleRegisterPsychic = async (name: string) => {
    if (!pendingIdToken) return;
    setAuthError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/auth/register-psychic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: pendingIdToken, name }),
      });
      if (res.ok) {
        setNeedsRegistration(false);
        setPendingIdToken(null);
        setAuthError("Your profile has been created and is pending admin approval. Please check back later.");
        await logout();
      } else {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || "Registration failed.");
      }
    } catch {
      setAuthError("Registration failed. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthInfo(null);
    setNeedsRegistration(false);
    setPendingIdToken(null);
    setAuthError(null);
    setLocation("/");
  };

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || (!authInfo && !needsRegistration)) {
    if (location === "/forgot-password") {
      return <ForgotPasswordPage />;
    }
    return (
      <LoginPage
        description="Sign in to continue"
        onAuthenticated={handleAuthenticated}
        externalError={authError}
      />
    );
  }

  if (needsRegistration) {
    return (
      <LoginPage
        description="Sign in to continue"
        onAuthenticated={handleAuthenticated}
        externalError={authError}
        showRegistration
        onRegister={handleRegisterPsychic}
        onCancel={handleLogout}
        registrationEmail={user.email || ""}
      />
    );
  }

  if (authInfo) {
    const isPortalRoute = location.startsWith("/portal");

    if (authInfo.isAdmin && isPortalRoute && authInfo.isPsychic && authInfo.psychic) {
      return <PortalView psychic={authInfo.psychic} onLogout={handleLogout} />;
    }

    if (authInfo.isAdmin) {
      return <AppLayout onLogout={handleLogout} userEmail={authInfo.email} />;
    }

    if (authInfo.isPsychic && authInfo.psychic) {
      return <PortalView psychic={authInfo.psychic} onLogout={handleLogout} />;
    }
  }

  return (
    <LoginPage
      description="Sign in to continue"
      onAuthenticated={handleAuthenticated}
      externalError={authError}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FirebaseAuthProvider>
          <TooltipProvider>
            <UnifiedAuthGate />
            <Toaster />
          </TooltipProvider>
        </FirebaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
