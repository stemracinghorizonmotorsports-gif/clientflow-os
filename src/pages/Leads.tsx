import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowRightCircle, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type Stage = { id: string; name: string; sort_order: number };

const Leads = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "",
    notes: "",
  });

  const [convertForm, setConvertForm] = useState({
    title: "",
    value: "0",
    stage_id: "",
    expected_close_date: "",
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["pipeline_stages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("id, name, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data as Stage[];
    },
  });

  const createLead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!form.name.trim()) throw new Error("Name is required");
      const { error } = await supabase.from("leads").insert({
        user_id: user.id,
        name: form.name.trim(),
        company: form.company.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        source: form.source.trim() || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead created");
      setForm({ name: "", company: "", email: "", phone: "", source: "", notes: "" });
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["leads", user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create lead"),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead deleted");
      qc.invalidateQueries({ queryKey: ["leads", user?.id] });
    },
  });

  const convertToDeal = useMutation({
    mutationFn: async () => {
      if (!user || !convertLead) throw new Error("No lead selected");
      if (!convertForm.title.trim()) throw new Error("Deal title required");
      if (!convertForm.stage_id) throw new Error("Pick a stage");
      const { error } = await supabase.from("deals").insert({
        user_id: user.id,
        lead_id: convertLead.id,
        title: convertForm.title.trim(),
        value: Number(convertForm.value) || 0,
        stage_id: convertForm.stage_id,
        expected_close_date: convertForm.expected_close_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deal created from lead");
      setConvertLead(null);
      setConvertForm({ title: "", value: "0", stage_id: "", expected_close_date: "" });
      qc.invalidateQueries({ queryKey: ["deals", user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to convert"),
  });

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      (l.company ?? "").toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground mt-1">Top of funnel — contacts not yet clients</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> New lead
          </button>
        </motion.div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary text-sm"
          />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {leads.length === 0 ? "No leads yet. Add your first one." : "No leads match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-secondary/20 transition">
                      <td className="px-4 py-3 text-foreground font-medium">{l.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.company ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.source ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setConvertLead(l);
                              setConvertForm({
                                title: `${l.company ?? l.name} deal`,
                                value: "0",
                                stage_id: stages[0]?.id ?? "",
                                expected_close_date: "",
                              });
                            }}
                            className="p-2 rounded-md hover:bg-primary/10 text-primary"
                            title="Convert to deal"
                          >
                            <ArrowRightCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLead.mutate(l.id)}
                            className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create lead dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>New lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { k: "name", label: "Name *" },
              { k: "company", label: "Company" },
              { k: "email", label: "Email" },
              { k: "phone", label: "Phone" },
              { k: "source", label: "Source (e.g. referral, inbound)" },
            ].map((f) => (
              <div key={f.k} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input
                  value={(form as any)[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary text-sm"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => createLead.mutate()}
              disabled={createLead.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50"
            >
              {createLead.isPending ? "Creating…" : "Create lead"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog open={!!convertLead} onOpenChange={(o) => !o && setConvertLead(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Convert to deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Deal title *</label>
              <input
                value={convertForm.title}
                onChange={(e) => setConvertForm({ ...convertForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={convertForm.value}
                  onChange={(e) => setConvertForm({ ...convertForm, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Expected close</label>
                <input
                  type="date"
                  value={convertForm.expected_close_date}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, expected_close_date: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Stage *</label>
              <select
                value={convertForm.stage_id}
                onChange={(e) => setConvertForm({ ...convertForm, stage_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select stage…</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setConvertLead(null)}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => convertToDeal.mutate()}
              disabled={convertToDeal.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50"
            >
              {convertToDeal.isPending ? "Creating…" : "Create deal"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Leads;
