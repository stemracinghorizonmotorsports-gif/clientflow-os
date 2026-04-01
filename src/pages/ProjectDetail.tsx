import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Circle, Plus, Loader2, Pencil } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const toggleTask = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["projects-with-tasks"] });
      // Update project progress
      updateProgress();
    },
  });

  const addTask = async () => {
    if (!newTaskTitle.trim() || !user || !id) return;
    setAddingTask(true);
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t: any) => t.sort_order || 0)) : 0;
    await supabase.from("tasks").insert({
      title: newTaskTitle.trim(),
      project_id: id,
      user_id: user.id,
      sort_order: maxOrder + 1,
      is_milestone: false,
    });
    setNewTaskTitle("");
    setAddingTask(false);
    queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
  };

  const updateProgress = async () => {
    if (!id) return;
    const { data: allTasks } = await supabase.from("tasks").select("status").eq("project_id", id);
    if (!allTasks || allTasks.length === 0) return;
    const completed = allTasks.filter((t: any) => t.status === "completed").length;
    const progress = Math.round((completed / allTasks.length) * 100);
    await supabase.from("projects").update({ progress }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["project", id] });
  };

  const milestones = tasks.filter((t: any) => t.is_milestone);
  const regularTasks = tasks.filter((t: any) => !t.is_milestone);
  const completedCount = tasks.filter((t: any) => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (projectLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-muted-foreground">Project not found.</p>
          <button onClick={() => navigate("/projects")} className="mt-4 text-primary hover:underline text-sm">
            ← Back to Projects
          </button>
        </div>
      </AppLayout>
    );
  }

  const statusLabel = project.status === "in-progress" ? "In Progress" : project.status.charAt(0).toUpperCase() + project.status.slice(1);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate("/projects")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">{project.name}</h1>
              <p className="text-muted-foreground mt-1">{(project as any).clients?.name || "Unknown Client"}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              statusLabel === "Review" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
            }`}>
              {statusLabel}
            </span>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Overall Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{completedCount} of {tasks.length} tasks completed</p>
        </motion.div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4">Milestones</h2>
            <div className="flex gap-2 flex-wrap">
              {milestones.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => toggleTask.mutate({ taskId: m.id, currentStatus: m.status })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition cursor-pointer ${
                    m.status === "completed"
                      ? "border-success/30 bg-success/5 text-success"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  {m.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tasks */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
          <h2 className="font-heading font-semibold text-foreground mb-4">Tasks</h2>

          {tasksLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : regularTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No tasks yet. Add one below.</p>
          ) : (
            <div className="space-y-1">
              {regularTasks.map((task: any) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask.mutate({ taskId: task.id, currentStatus: task.status })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition text-left"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Add Task */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task…"
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <button
              onClick={addTask}
              disabled={!newTaskTitle.trim() || addingTask}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ProjectDetail;
