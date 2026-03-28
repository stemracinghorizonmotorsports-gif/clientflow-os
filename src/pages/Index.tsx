import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  DollarSign,
  CheckSquare,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const stats = [
  { label: "Active Clients", value: "24", change: "+3", icon: Users, trend: "up" },
  { label: "Projects", value: "38", change: "+5", icon: FolderKanban, trend: "up" },
  { label: "Pending Approvals", value: "7", change: "-2", icon: CheckSquare, trend: "down" },
  { label: "Revenue (MTD)", value: "$42.8k", change: "+12%", icon: DollarSign, trend: "up" },
];

const recentActivity = [
  { client: "Acme Corp", action: "Homepage design approved", time: "2 min ago", type: "approval" },
  { client: "TechStart", action: "Invoice #1042 paid — $3,500", time: "1 hr ago", type: "payment" },
  { client: "GreenLeaf", action: "New revision request submitted", time: "3 hrs ago", type: "request" },
  { client: "PixelPerfect", action: "Project milestone completed", time: "5 hrs ago", type: "milestone" },
  { client: "CloudNine", action: "Onboarding workflow started", time: "1 day ago", type: "onboard" },
];

const upcomingDeadlines = [
  { project: "Brand Redesign", client: "Acme Corp", due: "Tomorrow", status: "On Track" },
  { project: "SEO Audit", client: "TechStart", due: "In 3 days", status: "At Risk" },
  { project: "Social Campaign", client: "GreenLeaf", due: "In 5 days", status: "On Track" },
];

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your client operations</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  stat.trend === "up" ? "text-success" : "text-warning"
                }`}>
                  {stat.change}
                  <TrendingUp className={`w-3 h-3 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                </span>
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-start gap-4 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-secondary-foreground">
                      {item.client.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.client}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Deadlines */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-foreground mb-4">Upcoming Deadlines</h2>
            <div className="space-y-4">
              {upcomingDeadlines.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="p-4 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-foreground">{item.project}</h3>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.client}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{item.due}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === "On Track"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
