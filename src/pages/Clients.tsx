import { motion } from "framer-motion";
import { Search, Plus, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

const clientsData = [
  { id: "1", name: "Acme Corp", projects: 3, status: "Active", revenue: "$12,400", avatar: "A", lastActive: "2 min ago" },
  { id: "2", name: "TechStart", projects: 2, status: "Active", revenue: "$8,200", avatar: "T", lastActive: "1 hr ago" },
  { id: "3", name: "GreenLeaf", projects: 4, status: "Active", revenue: "$15,600", avatar: "G", lastActive: "3 hrs ago" },
  { id: "4", name: "PixelPerfect", projects: 1, status: "Onboarding", revenue: "$0", avatar: "P", lastActive: "1 day ago" },
  { id: "5", name: "CloudNine", projects: 2, status: "Active", revenue: "$6,800", avatar: "C", lastActive: "2 days ago" },
  { id: "6", name: "BrightWave", projects: 3, status: "Paused", revenue: "$9,100", avatar: "B", lastActive: "1 week ago" },
];

const Clients = () => {
  const [search, setSearch] = useState("");
  const filtered = clientsData.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">{clientsData.length} total clients</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary">
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/clients/${client.id}`}
                className="block glass-card rounded-xl p-5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{client.avatar}</span>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition">
                        {client.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{client.lastActive}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{client.projects} projects</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.status === "Active"
                      ? "bg-success/10 text-success"
                      : client.status === "Onboarding"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">Revenue (MTD)</p>
                  <p className="text-lg font-heading font-bold text-foreground">{client.revenue}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Clients;
