import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Approval = {
  id: string;
  title: string;
  client: string;
  project: string;
  submitted: string;
  type: string;
  status: "pending" | "approved" | "rejected";
};

const Approvals = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Approval | null>(null);

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select("*, clients(name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        client: a.clients?.name || "Unknown",
        project: a.projects?.name || "Unknown",
        submitted: new Date(a.created_at).toLocaleDateString(),
        type: a.type,
        status: a.status as "pending" | "approved" | "rejected",
      })) as Approval[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("approvals").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(vars.status === "approved" ? "Approved" : "Rejected");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pending = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold text-foreground">Approvals</h1>
          <p className="text-muted-foreground mt-1">{pending.length} pending review</p>
        </motion.div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {!isLoading && approvals.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-foreground font-medium">No approvals yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Approval requests from your projects will appear here.
            </p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending</h2>
            {pending.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.client} · {item.project} · {item.submitted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground mr-2">{item.type}</span>
                  <button
                    onClick={() => setSelected(item)}
                    title="View details"
                    className="p-2 rounded-lg bg-secondary hover:bg-muted transition text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: item.id, status: "approved" })}
                    disabled={updateStatus.isPending}
                    title="Approve"
                    className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: item.id, status: "rejected" })}
                    disabled={updateStatus.isPending}
                    title="Reject"
                    className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {resolved.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Resolved</h2>
            {resolved.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 flex items-center justify-between opacity-70"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === "approved" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {item.status === "approved" ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-destructive" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.client} · {item.project}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {item.status === "approved" ? "Approved" : "Rejected"}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="text-foreground">{selected?.client}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project</span>
              <span className="text-foreground">{selected?.project}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="text-foreground">{selected?.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span className="text-foreground">{selected?.submitted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-foreground capitalize">{selected?.status}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {selected?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selected) updateStatus.mutate({ id: selected.id, status: "rejected" });
                    setSelected(null);
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  onClick={() => {
                    if (selected) updateStatus.mutate({ id: selected.id, status: "approved" });
                    setSelected(null);
                  }}
                >
                  <Check className="w-4 h-4 mr-1" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Approvals;
