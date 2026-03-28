import { motion } from "framer-motion";
import { Send, Search } from "lucide-react";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

const conversations = [
  { id: "1", client: "Acme Corp", project: "Brand Redesign", lastMessage: "Looks great, let's proceed!", time: "2 min", unread: 2 },
  { id: "2", client: "TechStart", project: "SEO Optimization", lastMessage: "Can we schedule a call?", time: "1 hr", unread: 0 },
  { id: "3", client: "GreenLeaf", project: "Social Campaign", lastMessage: "I've uploaded the new assets.", time: "3 hrs", unread: 1 },
  { id: "4", client: "CloudNine", project: "Website Rebuild", lastMessage: "When will wireframes be ready?", time: "1 day", unread: 0 },
];

const messages = [
  { sender: "client", text: "Hey, just checking in on the homepage design. Any updates?", time: "10:32 AM" },
  { sender: "business", text: "Hi! Yes, we've finalized the hero section. Uploading the mockup now.", time: "10:45 AM" },
  { sender: "business", text: "Here's the latest version with your feedback incorporated.", time: "10:46 AM" },
  { sender: "client", text: "Looks great, let's proceed!", time: "10:50 AM" },
];

const Messages = () => {
  const [activeConvo, setActiveConvo] = useState("1");
  const [newMessage, setNewMessage] = useState("");

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Project-based communication</p>
        </motion.div>

        <div className="glass-card rounded-xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
          {/* Sidebar */}
          <div className="w-80 border-r border-border/50 flex flex-col">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setActiveConvo(convo.id)}
                  className={`w-full text-left p-4 border-b border-border/30 transition-all ${
                    activeConvo === convo.id ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{convo.client}</span>
                    <span className="text-xs text-muted-foreground">{convo.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{convo.project}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate pr-2">{convo.lastMessage}</p>
                    {convo.unread > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {convo.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border/50">
              <h3 className="font-heading font-semibold text-foreground">Acme Corp</h3>
              <p className="text-xs text-muted-foreground">Brand Redesign</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex ${msg.sender === "business" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
                    msg.sender === "business"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === "business" ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}>{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
                <button className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
