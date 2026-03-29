import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, DollarSign, Bell, CheckCircle2, Circle, Clock, Upload, Share2, Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const tabs = ["Timeline", "Files", "Invoices", "Updates"];

const filesData = [
  { name: "Brand Guidelines v2.pdf", size: "2.4 MB", date: "Mar 24" },
  { name: "Homepage Mockup.fig", size: "18 MB", date: "Mar 25" },
  { name: "SEO Report Draft.docx", size: "540 KB", date: "Mar 20" },
  { name: "Logo Files.zip", size: "8.2 MB", date: "Mar 22" },
];

const ClientWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Timeline");
  const [portalLink, setPortalLink] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("client_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client-tasks", id],
    queryFn: async () => {
      if (projects.length === 0) return [];
      const projectIds = projects.map((p) => p.id);
      const { data, error } = await supabase.from("tasks").select("*").in("project_id", projectIds).order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: projects.length > 0,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["client-invoices", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["client-updates", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_updates").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const generatePortalLink = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Missing data");
      const { data, error } = await supabase
        .from("client_portal_tokens")
        .insert({ client_id: id, user_id: user.id })
        .select("token")
        .single();
      if (error) throw error;
      return `${window.location.origin}/portal/${data.token}`;
    },
    onSuccess: (link) => { setPortalLink(link); toast.success("Portal link generated!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const generateUpdate = useMutation({
    mutationFn: async () => {
      if (!user || !id || !client || projects.length === 0) throw new Error("Need client with projects");
      const { data, error } = await supabase.functions.invoke("generate-client-update", {
        body: { tasks, clientName: client.name, projectName: projects[0].name },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      // Save the update
      const { error: insertErr } = await supabase.from("client_updates").insert({
        client_id: id,
        user_id: user.id,
        title: data.title,
        body: data.body,
      });
      if (insertErr) throw insertErr;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-updates", id] });
      toast.success("AI update generated & saved!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const copyLink = () => {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/clients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{client?.avatar_initial || client?.name?.charAt(0) || "?"}</span>
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">{client?.name || "Client"}</h1>
                <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? "s" : ""} · {client?.company || ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {portalLink ? (
                <div className="flex items-center gap-2">
                  <input readOnly value={portalLink} className="px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground w-48 truncate" />
                  <button onClick={copyLink} className="p-2 rounded-lg bg-secondary hover:bg-muted transition text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <button onClick={() => generatePortalLink.mutate()} disabled={generatePortalLink.isPending} className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition">
                  <Share2 className="w-4 h-4" />
                  Share Portal
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
              {tab}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "Timeline" && (
            <div className="space-y-4">
              {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet for this client.</p>}
              {tasks.map((task: any, i: number) => (
                <div key={task.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : task.status === "in-progress" ? (
                      <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    {i < tasks.length - 1 && <div className="w-px h-full bg-border/50 mt-2" />}
                  </div>
                  <div className="glass-card rounded-xl p-4 flex-1 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground text-sm">{task.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.status === "completed" ? "bg-success/10 text-success" :
                        task.status === "in-progress" ? "bg-primary/10 text-primary" :
                        "bg-secondary text-muted-foreground"
                      }`}>{task.status}</span>
                    </div>
                    {task.is_milestone && <span className="text-xs text-warning">★ Milestone</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Files" && (
            <div className="space-y-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition">
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              {filesData.map((file, i) => (
                <div key={i} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} · {file.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Invoices" && (
            <div className="space-y-3">
              {invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices for this client yet.</p>}
              {invoices.map((inv: any) => (
                <div key={inv.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-heading font-bold text-foreground">${Number(inv.amount).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Updates" && (
            <div className="space-y-4">
              <button
                onClick={() => generateUpdate.mutate()}
                disabled={generateUpdate.isPending || tasks.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary disabled:opacity-50"
              >
                {generateUpdate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate AI Update
              </button>
              {updates.length === 0 && !generateUpdate.isPending && (
                <p className="text-sm text-muted-foreground">No updates yet. Use AI to generate one from your task progress.</p>
              )}
              {updates.map((update: any) => (
                <div key={update.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">{update.title}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(update.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{update.body}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ClientWorkspace;
