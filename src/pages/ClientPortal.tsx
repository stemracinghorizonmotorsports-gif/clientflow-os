import { motion } from "framer-motion";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, FileText, DollarSign, Bell, Zap, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const tabs = ["Timeline", "Invoices", "Updates"];

const ClientPortal = () => {
  const { token } = useParams();
  const [activeTab, setActiveTab] = useState("Timeline");

  // Validate token via secure RPC
  const { data: client, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["portal-client", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_portal_client", { _token: token! });
      if (error || !data || data.length === 0) throw new Error("Invalid or expired link");
      return data[0];
    },
    enabled: !!token,
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["portal-projects", token],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_portal_projects", { _token: token! });
      return data || [];
    },
    enabled: !!token && !!client,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["portal-invoices", token],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_portal_invoices", { _token: token! });
      return data || [];
    },
    enabled: !!token && !!client,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["portal-updates", token],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_portal_updates", { _token: token! });
      return data || [];
    },
    enabled: !!token && !!client,
  });

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <Lock className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">{(tokenError as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-heading font-bold text-foreground text-sm">{client?.name || "Client"} Portal</p>
              <p className="text-xs text-muted-foreground">{client?.company || ""}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 pt-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Active Projects", value: projects.length },
            { label: "Invoices", value: invoices.length },
            { label: "Updates", value: updates.length },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "Timeline" && (
            <div className="space-y-4">
              {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
              {projects.map((project) => (
                <div key={project.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground text-sm">{project.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${project.status === "completed" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{project.status}</span>
                  </div>
                  {project.progress != null && (
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === "Invoices" && (
            <div className="space-y-3">
              {invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
              {invoices.map((inv) => (
                <div key={inv.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.due_date || "No due date"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-heading font-bold text-foreground">${Number(inv.amount).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "Updates" && (
            <div className="space-y-3">
              {updates.length === 0 && (
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">Welcome to your portal!</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Track your project progress, view invoices, and stay up to date.</p>
                </div>
              )}
              {updates.map((update) => (
                <div key={update.id} className="glass-card rounded-xl p-4">
                  <h3 className="text-sm font-medium text-foreground mb-1">{update.title}</h3>
                  <p className="text-sm text-muted-foreground">{update.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(update.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ClientPortal;
