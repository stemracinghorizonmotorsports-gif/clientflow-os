import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, DollarSign, Bell, CheckCircle2, Circle, Clock, Upload, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const tabs = ["Timeline", "Files", "Invoices", "Updates"];

const timelineData = [
  { title: "Homepage Design Delivered", date: "Mar 25", status: "completed", description: "Final homepage mockups delivered for review." },
  { title: "Client Approval — Logo", date: "Mar 22", status: "completed", description: "Logo v3 was approved by the client." },
  { title: "SEO Audit Started", date: "Mar 20", status: "in-progress", description: "Technical SEO audit is in progress." },
  { title: "Content Strategy Review", date: "Mar 28", status: "upcoming", description: "Review content calendar for Q2." },
  { title: "Social Media Launch", date: "Apr 2", status: "upcoming", description: "Launch new social media campaigns." },
];

const filesData = [
  { name: "Brand Guidelines v2.pdf", size: "2.4 MB", date: "Mar 24" },
  { name: "Homepage Mockup.fig", size: "18 MB", date: "Mar 25" },
  { name: "SEO Report Draft.docx", size: "540 KB", date: "Mar 20" },
  { name: "Logo Files.zip", size: "8.2 MB", date: "Mar 22" },
];

const invoicesData = [
  { id: "INV-1042", amount: "$3,500", status: "Paid", date: "Mar 15" },
  { id: "INV-1038", amount: "$2,800", status: "Paid", date: "Feb 15" },
  { id: "INV-1055", amount: "$4,200", status: "Pending", date: "Mar 28" },
];

const updatesData = [
  { title: "Q1 Performance Report Ready", date: "Mar 25", body: "Your Q1 performance report is now available. Key highlights: 34% increase in organic traffic, 22% improvement in conversion rate." },
  { title: "New Team Member Assigned", date: "Mar 18", body: "Sarah has joined as your dedicated content strategist. She'll be handling all content-related deliverables." },
];

const ClientWorkspace = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Timeline");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/clients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Acme Corp</h1>
              <p className="text-sm text-muted-foreground">3 active projects · Client since Jan 2024</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "Timeline" && (
            <div className="space-y-4">
              {timelineData.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : item.status === "in-progress" ? (
                      <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    {i < timelineData.length - 1 && (
                      <div className="w-px h-full bg-border/50 mt-2" />
                    )}
                  </div>
                  <div className="glass-card rounded-xl p-4 flex-1 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
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
              {invoicesData.map((inv, i) => (
                <div key={i} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.id}</p>
                      <p className="text-xs text-muted-foreground">{inv.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-heading font-bold text-foreground">{inv.amount}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === "Paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Updates" && (
            <div className="space-y-4">
              {updatesData.map((update, i) => (
                <div key={i} className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">{update.title}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{update.date}</span>
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
