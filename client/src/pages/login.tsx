import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import logoPath from "@assets/psychicsource-logo-nobg.png";

interface LoginPageProps {
  title?: string;
  description?: string;
  onAuthenticated: (idToken: string) => void;
  externalError?: string | null;
  showRegistration?: boolean;
  onRegister?: (name: string) => void;
  onCancel?: () => void;
  registrationEmail?: string;
}

export default function LoginPage({
  title = "Sign In",
  description = "Sign in to access the dashboard",
  onAuthenticated,
  externalError,
  showRegistration,
  onRegister,
  onCancel,
  registrationEmail,
}: LoginPageProps) {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayError = error || externalError;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [psychicName, setPsychicName] = useState("");

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      const idToken = await result.user.getIdToken();
      onAuthenticated(idToken);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      setError(getFirebaseErrorMessage(err));
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
      onAuthenticated(idToken);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!psychicName.trim() || !onRegister) return;
    onRegister(psychicName.trim());
  };

  if (showRegistration) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logoPath} alt="Psychic Source" className="h-20 object-contain" data-testid="img-logo" />
            </div>
            <CardTitle className="text-xl" data-testid="text-register-title">Complete Your Profile</CardTitle>
            <CardDescription data-testid="text-register-description">
              Set up your psychic profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayError && (
              <Alert variant="destructive" data-testid="alert-register-error">
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            {registrationEmail && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="text-sm font-medium" data-testid="text-register-email">{registrationEmail}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="psychic-name">Your Name</Label>
                <Input
                  id="psychic-name"
                  type="text"
                  placeholder="Enter your name"
                  value={psychicName}
                  onChange={(e) => setPsychicName(e.target.value)}
                  autoFocus
                  data-testid="input-psychic-name"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!psychicName.trim()}
                data-testid="button-register-psychic"
              >
                Create Profile
              </Button>
            </form>

            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              data-testid="button-cancel-register"
            >
              Cancel & Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="Psychic Source" className="h-20 object-contain" data-testid="img-logo" />
          </div>
          {title && <CardTitle className="text-xl" data-testid="text-login-title">{title}</CardTitle>}
          <CardDescription data-testid="text-login-description">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayError && (
            <Alert variant="destructive" data-testid="alert-login-error">
              <AlertDescription>{displayError}</AlertDescription>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                data-testid="input-login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                data-testid="input-login-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || !password}
              data-testid="button-email-login"
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
              data-testid="button-toggle-signup"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function getFirebaseErrorMessage(err: any): string {
  const code = err?.code;
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return err?.message || "Login failed. Please try again.";
  }
}
