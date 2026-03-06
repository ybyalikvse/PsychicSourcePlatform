import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalLayout } from "@/components/portal-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { apiRequest } from "@/lib/queryClient";
import type { Psychic } from "@shared/schema";

interface PortalLoginProps {
  onLogin: (psychic: Psychic) => void;
}

export default function PortalLogin({ onLogin }: PortalLoginProps) {
  const { loginWithGoogle } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      const idToken = await result.user.getIdToken();

      const res = await apiRequest("POST", "/api/portal/auth/firebase", { idToken });
      const psychic: Psychic = await res.json();
      onLogin(psychic);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      let message = "Login failed. Please try again.";
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) message = parsed.error;
        } catch {
          if (err.message.includes("No psychic profile")) {
            message = "No psychic profile found for this account. Please contact an administrator.";
          } else if (err.message.includes("inactive")) {
            message = "Your psychic profile is inactive. Please contact an administrator.";
          }
        }
      }
      if (err?.data?.error) {
        message = err.data.error;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full p-3 bg-primary/10">
                <Video className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl" data-testid="text-portal-title">Psychic Video Portal</CardTitle>
            <CardDescription data-testid="text-portal-description">
              Sign in with your Google account to access video requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" data-testid="alert-login-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              className="w-full"
              variant="outline"
              disabled={loading}
              onClick={handleGoogleLogin}
              data-testid="button-google-login"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SiGoogle className="h-4 w-4 mr-2" />
              )}
              Sign in with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground" data-testid="text-login-help">
              Your Google account email must match the email in your psychic profile.
              Contact an administrator if you need help.
            </p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
