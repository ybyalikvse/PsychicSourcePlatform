import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  const { loginWithGoogle, loginWithEmail, signUpWithEmail } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const verifyPsychic = async (idToken: string) => {
    const res = await apiRequest("POST", "/api/portal/auth/firebase", { idToken });
    const psychic: Psychic = await res.json();
    onLogin(psychic);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      const idToken = await result.user.getIdToken();
      await verifyPsychic(idToken);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email, password);
      } else {
        result = await loginWithEmail(email, password);
      }
      const idToken = await result.user.getIdToken();
      await verifyPsychic(idToken);
    } catch (err: any) {
      setError(getErrorMessage(err));
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
              Sign in to access video requests
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
              Continue with Google
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="portal-email">Email</Label>
                <Input
                  id="portal-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  data-testid="input-portal-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-password">Password</Label>
                <Input
                  id="portal-password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  data-testid="input-portal-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email || !password}
                data-testid="button-portal-email-login"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                data-testid="button-toggle-portal-signup"
              >
                {isSignUp ? "Sign in" : "Create one"}
              </button>
            </p>

            <p className="text-xs text-center text-muted-foreground" data-testid="text-login-help">
              Your email must match the email in your psychic profile.
              Contact an administrator if you need help.
            </p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function getErrorMessage(err: any): string {
  if (err?.code) {
    switch (err.code) {
      case "auth/invalid-email": return "Invalid email address.";
      case "auth/user-disabled": return "This account has been disabled.";
      case "auth/user-not-found": return "No account found with this email.";
      case "auth/wrong-password": return "Incorrect password.";
      case "auth/invalid-credential": return "Invalid email or password.";
      case "auth/email-already-in-use": return "An account with this email already exists.";
      case "auth/weak-password": return "Password must be at least 6 characters.";
      case "auth/too-many-requests": return "Too many attempts. Please try again later.";
    }
  }
  let message = err?.message || "Login failed. Please try again.";
  try {
    const parsed = JSON.parse(message);
    if (parsed.error) message = parsed.error;
  } catch {}
  return message;
}
