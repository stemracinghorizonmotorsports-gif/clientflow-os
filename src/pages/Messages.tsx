import { motion } from "framer-motion";
import { Send, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["message-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_id, clients(name)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const activeProject = projects.find((p: any) => p.id === activeProjectId);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", activeProjectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeProjectId,
    refetchInterval: 3000, // Poll every 3s instead of realtime
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !activeProjectId || !activeProject) throw new Error("Missing data");
      const { error } = await supabase.from("messages").insert({
        project_id: activeProjectId,
        client_id: (activeProject as any).client_id,
        user_id: user.id,
        sender_type: "business",
        content: newMessage.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeProjectId] });
    },
  });

  const filteredProjects = projects.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.clients?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (newMessage.trim()) sendMessage.mutate();
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Project-based communication</p>
        </motion.div>

        <div className="glass-card rounded-xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
          {/* Sidebar */}
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredProjects.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No projects yet. Add a client first.</p>
              )}
              {filteredProjects.map((project: any) => (
                <button
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  className={`w-full text-left p-4 border-b border-border/60 transition-all ${
                    activeProjectId === project.id ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{project.clients?.name || "Unknown"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {activeProject ? (
              <>
                <div className="p-4 border-b border-border">
                  <h3 className="font-heading font-semibold text-foreground">{(activeProject as any).clients?.name || "Client"}</h3>
                  <p className="text-xs text-muted-foreground">{activeProject.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-8">No messages yet. Start the conversation!</p>
                  )}
                  {messages.map((msg: any, i: number) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`flex ${msg.sender_type === "business" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
                        msg.sender_type === "business"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_type === "business" ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a project to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
