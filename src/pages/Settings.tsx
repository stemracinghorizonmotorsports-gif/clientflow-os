import { motion } from "framer-motion";
import { LogOut, User, Mail, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";

const Settings = () => {
  const { user, signOut } = useAuth();
  const isAnonymous = (user as any)?.is_anonymous;

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
              You're using a guest session. Sign up with email to save your data permanently.
            </div>
          )}
        </motion.div>

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
