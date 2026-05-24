import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import GoogleSignIn from "@/components/GoogleLogin";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — INK Academy" },
      {
        name: "description",
        content: "Sign in to INK Academy ERP with your Google account.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (loading) return;
    if (user) {
      if (user.role === "Faculty") {
        navigate({ to: "/attendance" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, loading, navigate]);

  const handleGoogleSuccess = async (credential: string) => {
    setSigningIn(true);
    try {
      const authUser = await googleSignIn(credential);
      toast.success(`Welcome, ${authUser.name}!`);

      if (authUser.role === "Faculty") {
        navigate({ to: "/attendance" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (error: any) {
      const message = error?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-in was cancelled or failed.");
  };

  // Show loading state while auth is hydrating
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render login form if already authenticated (redirect is happening)
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo + branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            INK Academy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tuition center management, simplified.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 text-center">
            <h2 className="text-lg font-semibold">Welcome back</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in with your authorized Google account
            </p>
          </div>

          {/* Google Sign-In button */}
          {signingIn ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleSignIn
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>
          )}

          {/* Footer note */}
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-accent/50 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Only pre-registered Owner, Coordinator, and Faculty accounts can
              sign in. Contact the administrator if you need access.
            </p>
          </div>
        </div>

        {/* Bottom attribution */}
        <p className="mt-6 text-center text-[10px] text-muted-foreground/60">
          Powered by NeuralWeb Labs
        </p>
      </div>
    </div>
  );
}
