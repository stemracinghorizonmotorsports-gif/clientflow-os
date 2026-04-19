import { motion } from "framer-motion";
import { LogOut, User, Mail, Shield, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const Settings = () => {
  const { user, signOut } = useAuth();
  const isAnonymous = (user as any)?.is_anonymous;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const handleEmailUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 8) {
      toast.error("Enter an email and a password (min 8 characters).");
      return;
    }
    setSubmitting(true);
    try {
      // Step 1: attach email — sends a confirmation link to verify ownership.
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) throw emailErr;
      // Step 2: set password so the user can sign in after confirming.
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw pwErr;
      toast.success(
        "Check your inbox to confirm the email. Your data is preserved on this account."
      );
      setEmail("");
      setPassword("");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not upgrade account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLink = async () => {
    setLinkingGoogle(true);
    try {
      // For an anonymous user, signing in with Google links the identity
      // and converts the account to permanent without losing data.
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/settings",
      });
      if (result.error) throw result.error;
      // If redirected, browser navigates away — nothing else to do.
    } catch (err: any) {
      toast.error(err?.message ?? "Could not link Google account");
      setLinkingGoogle(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account & preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Account
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <span className="text-sm text-foreground">
                {user?.email || (isAnonymous ? "Guest session" : "—")}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Account type
              </span>
              <span className="text-sm text-foreground">
                {isAnonymous ? "Guest" : "Registered"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-xs text-muted-foreground font-mono">{user?.id?.slice(0, 12)}…</span>
            </div>
          </div>

          {isAnonymous && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning">
              You're using a guest session. Upgrade below to keep your data permanently.
            </div>
          )}
        </motion.div>

        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass-card rounded-xl p-6 space-y-5"
          >
            <div>
              <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" /> Upgrade your account
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Attach an email + password or Google to keep your clients, projects, and invoices.
              </p>
            </div>

            <form onSubmit={handleEmailUpgrade} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password (min 8)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {submitting ? "Upgrading…" : "Upgrade with email"}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLink}
              disabled={linkingGoogle}
              className="w-full px-4 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition disabled:opacity-50 border border-border"
            >
              {linkingGoogle ? "Redirecting…" : "Continue with Google"}
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="font-heading font-semibold text-foreground mb-4">Session</h2>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;
