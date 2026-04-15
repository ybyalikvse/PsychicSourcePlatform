import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import logoPath from "@assets/psychicsource-logo_1773022542325.png";

export default function ForgotPasswordPage() {
  const { resetPassword } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="Psychic Source" className="h-20 object-contain" data-testid="img-logo" />
          </div>
          <CardTitle className="text-xl" data-testid="text-forgot-title">Reset Password</CardTitle>
          <CardDescription data-testid="text-forgot-description">
            {sent
              ? "Check your email for a link to reset your password."
              : "Enter your email and we'll send you a password reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" data-testid="alert-forgot-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sent ? (
            <Alert data-testid="alert-forgot-success">
              <AlertDescription>
                If an account exists for <span className="font-medium">{email}</span>, a reset link
                has been sent. It may take a few minutes to arrive — check your spam folder if you
                don't see it.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                  data-testid="input-forgot-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email}
                data-testid="button-forgot-submit"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Send Reset Link
              </Button>
            </form>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setLocation("/")}
            data-testid="button-forgot-back"
          >
            Back to Sign In
          </Button>
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
    case "auth/user-not-found":
      // Don't leak whether an account exists — treat as success-ish.
      return "";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return err?.message || "Failed to send reset email. Please try again.";
  }
}
