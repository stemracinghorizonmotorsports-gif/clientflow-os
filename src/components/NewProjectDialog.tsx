import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_MILESTONES = [
  { title: "Discovery", is_milestone: true, sort_order: 1 },
  { title: "Design", is_milestone: true, sort_order: 2 },
  { title: "Development", is_milestone: true, sort_order: 3 },
  { title: "Launch", is_milestone: true, sort_order: 4 },
];

const NewProjectDialog = ({ open, onClose }: NewProjectDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [step, setStep] = useState<"form" | "creating" | "done">("form");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleSubmit = async () => {
    if (!name.trim() || !clientId || !user) return;
    setStep("creating");

    const { data: project, error: pErr } = await supabase
      .from("projects")
      .insert({ name: name.trim(), client_id: clientId, user_id: user.id })
      .select()
      .single();
    if (pErr || !project) { setStep("form"); return; }

    await supabase.from("tasks").insert(
      DEFAULT_MILESTONES.map((m) => ({
        ...m,
        project_id: project.id,
        user_id: user.id,
      }))
    );

    await supabase.from("approvals").insert({
      title: `${name.trim()} – Initial Review`,
      project_id: project.id,
      client_id: clientId,
      user_id: user.id,
    });

    queryClient.invalidateQueries({ queryKey: ["projects-with-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    setStep("done");
  };

  const handleClose = () => {
    setName("");
    setClientId("");
    setStep("form");
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card rounded-2xl p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg font-bold text-foreground">New Project</h2>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "form" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Project Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brand Redesign"
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="">Select a client…</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !clientId}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          )}

          {step === "creating" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Setting up project…</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle2 className="w-10 h-10 text-success" />
              <p className="text-sm text-foreground font-medium">Project created!</p>
              <button onClick={handleClose} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewProjectDialog;
