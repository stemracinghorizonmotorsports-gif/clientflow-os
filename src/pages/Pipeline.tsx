import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, GripVertical } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Stage = {
  id: string;
  name: string;
  sort_order: number;
  win_probability: number;
  is_won: boolean;
  is_lost: boolean;
};

type Deal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage_id: string;
  expected_close_date: string | null;
};

const formatMoney = (v: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(v);

const DealCard = ({ deal }: { deal: Deal }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-card p-3 shadow-sm hover:border-primary/50 transition ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          title="Drag"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatMoney(Number(deal.value), deal.currency)}
          </p>
          {deal.expected_close_date && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Close: {new Date(deal.expected_close_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const StageColumn = ({
  stage,
  deals,
}: {
  stage: Stage;
  deals: Deal[];
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + Number(d.value), 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 flex-shrink-0 rounded-xl border ${
        isOver ? "border-primary bg-primary/5" : "border-border bg-secondary/20"
      } transition`}
    >
      <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{stage.name}</span>
          <span className="text-xs text-muted-foreground">({deals.length})</span>
          {stage.is_won && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success">won</span>
          )}
          {stage.is_lost && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">lost</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{formatMoney(total)}</span>
      </div>
      <div className="p-2 space-y-2 min-h-[120px]">
        {deals.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Drop deals here</p>
        ) : (
          deals.map((d) => <DealCard key={d.id} deal={d} />)
        )}
      </div>
    </div>
  );
};

const Pipeline = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    value: "0",
    stage_id: "",
    expected_close_date: "",
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["pipeline_stages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Stage[];
    },
  });

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, title, value, currency, stage_id, expected_close_date")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });

  const dealsByStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const d of deals) (map[d.stage_id] ??= []).push(d);
    return map;
  }, [stages, deals]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const moveDeal = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const { error } = await supabase
        .from("deals")
        .update({ stage_id: stageId })
        .eq("id", dealId);
      if (error) throw error;
    },
    onMutate: async ({ dealId, stageId }) => {
      await qc.cancelQueries({ queryKey: ["deals", user?.id] });
      const prev = qc.getQueryData<Deal[]>(["deals", user?.id]);
      qc.setQueryData<Deal[]>(["deals", user?.id], (old) =>
        (old ?? []).map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(["deals", user?.id], ctx?.prev);
      toast.error("Could not move deal");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals", user?.id] });
    },
  });

  const handleDragEnd = (e: DragEndEvent) => {
    const dealId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === overId) return;
    moveDeal.mutate({ dealId, stageId: overId });
  };

  const createDeal = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!form.title.trim()) throw new Error("Title required");
      if (!form.stage_id) throw new Error("Pick a stage");
      const { error } = await supabase.from("deals").insert({
        user_id: user.id,
        title: form.title.trim(),
        value: Number(form.value) || 0,
        stage_id: form.stage_id,
        expected_close_date: form.expected_close_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deal created");
      setCreateOpen(false);
      setForm({ title: "", value: "0", stage_id: "", expected_close_date: "" });
      qc.invalidateQueries({ queryKey: ["deals", user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create"),
  });

  // Forecast quick stats
  const weighted = useMemo(() => {
    return deals.reduce((sum, d) => {
      const stage = stages.find((s) => s.id === d.stage_id);
      const p = stage?.win_probability ?? 0;
      return sum + (Number(d.value) * p) / 100;
    }, 0);
  }, [deals, stages]);
  const openTotal = useMemo(() => {
    return deals.reduce((sum, d) => {
      const stage = stages.find((s) => s.id === d.stage_id);
      if (stage?.is_won || stage?.is_lost) return sum;
      return sum + Number(d.value);
    }, 0);
  }, [deals, stages]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Pipeline</h1>
            <p className="text-muted-foreground mt-1">Drag deals between stages</p>
          </div>
          <button
            onClick={() => {
              setForm({ title: "", value: "0", stage_id: stages[0]?.id ?? "", expected_close_date: "" });
              setCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> New deal
          </button>
        </motion.div>

        {/* Forecast strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Open pipeline</p>
            <p className="text-2xl font-heading font-bold text-foreground mt-1">
              {formatMoney(openTotal)}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Weighted forecast</p>
            <p className="text-2xl font-heading font-bold text-primary mt-1">
              {formatMoney(weighted)}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total deals</p>
            <p className="text-2xl font-heading font-bold text-foreground mt-1">{deals.length}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading pipeline…</div>
        ) : stages.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground">
              No stages yet. They should auto-seed on signup — try refreshing.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {stages.map((s) => (
                <StageColumn key={s.id} stage={s} deals={dealsByStage[s.id] ?? []} />
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>New deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Expected close</label>
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Stage *</label>
              <select
                value={form.stage_id}
                onChange={(e) => setForm({ ...form, stage_id: e.target.value })}
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
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => createDeal.mutate()}
              disabled={createDeal.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50"
            >
              {createDeal.isPending ? "Creating…" : "Create deal"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Pipeline;
