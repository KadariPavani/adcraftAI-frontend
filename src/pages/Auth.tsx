import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft, Loader2, Check,
} from "lucide-react";
import { useRegionalCopy } from "@/hooks/useRegionalCopy";
import { LanguageToggle } from "@/components/LanguageToggle";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const copy = useRegionalCopy();
  const [mode, setMode] = useState<Mode>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";
  const canSubmit = email.trim() && password.trim() && (!isSignup || name.trim()) && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      setIsLoading(false);
      if (error) {
        void track("auth_signup_failed", { message: error.message });
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
        return;
      }
      void track("auth_signup", { email_domain: email.split("@")[1] });
      toast({ title: "Welcome to AdCraft AI", description: "Your account has been created." });
      navigate("/dashboard");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (error) {
        void track("auth_login_failed", { message: error.message });
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
        return;
      }
      void track("auth_login", { email_domain: email.split("@")[1] });
      navigate("/dashboard");
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setPassword("");
    setShowPw(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient backdrop */}
      <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-50" />
      <div aria-hidden className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div aria-hidden className="absolute -bottom-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-tertiary/15 blur-3xl animate-blob [animation-delay:6s]" />
      <div aria-hidden className="absolute inset-0 bg-block-print opacity-40" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between p-5 md:p-7">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <LanguageToggle />
      </header>

      {/* Content */}
      <main className="relative z-10 px-5 pb-16">
        <div className="mx-auto w-full max-w-md animate-fade-up">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-7">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-marigold shadow-elevated mb-4">
              <Sparkles className="w-7 h-7 text-primary-foreground" strokeWidth={2.4} />
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-sm">
              {isSignup
                ? copy.authTagline
                : "Sign in to continue creating premium listings."}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-card border border-border/70 shadow-elevated overflow-hidden">
            {/* Segmented switch */}
            <div role="tablist" aria-label="Auth mode" className="grid grid-cols-2 bg-muted/40 border-b border-border/60">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "h-12 text-sm font-semibold transition-all relative",
                    mode === m
                      ? "text-foreground bg-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40",
                  )}
                >
                  {m === "signin" ? "Sign in" : "Sign up"}
                  {mode === m && (
                    <span aria-hidden className="absolute bottom-0 inset-x-6 h-0.5 rounded-full bg-gradient-marigold" />
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-4">
              {isSignup && (
                <Field id="name" label="Full name" icon={UserIcon}>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 h-12"
                    autoComplete="name"
                  />
                </Field>
              )}

              <Field id="email" label="Email" icon={Mail}>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12"
                  autoComplete="email"
                />
              </Field>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  {!isSignup && (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => toast({ title: "Coming soon", description: "Password reset is on the way." })}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder={isSignup ? "At least 6 characters" : ""}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={isSignup ? 6 : undefined}
                    required
                    className="pl-10 pr-11 h-12"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isSignup && (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-success" /> Minimum 6 characters
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full sheen mt-2 h-12 text-base"
                disabled={!canSubmit}
              >
                {isLoading
                  ? (<><Loader2 className="w-4 h-4 animate-spin" /> {isSignup ? "Creating account…" : "Signing in…"}</>)
                  : (isSignup ? "Create account" : "Sign in")}
              </Button>

              {isSignup && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  By signing up you agree to our terms. We never share your email.
                </p>
              )}
            </form>

            {/* Footer switch */}
            <div className="px-7 py-4 border-t border-border/60 bg-muted/30 text-center text-sm text-muted-foreground">
              {isSignup ? (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("signin")} className="text-primary font-semibold hover:underline">
                    Sign in
                  </button>
                </>
              ) : (
                <>New to AdCraft AI?{" "}
                  <button type="button" onClick={() => switchMode("signup")} className="text-primary font-semibold hover:underline">
                    Create account
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Made for Indian creators · Free to start
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  id, label, icon: Icon, children,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {children}
      </div>
    </div>
  );
}
