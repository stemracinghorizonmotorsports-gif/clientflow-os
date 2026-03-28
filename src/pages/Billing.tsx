import { motion } from "framer-motion";
import { Plus, DollarSign, TrendingUp, Receipt, BarChart3 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const billingStats = [
  { label: "Revenue (MTD)", value: "$42,800", icon: DollarSign },
  { label: "Outstanding", value: "$7,200", icon: Receipt },
  { label: "Collected", value: "$35,600", icon: TrendingUp },
  { label: "Avg. Per Client", value: "$1,783", icon: BarChart3 },
];

const recentInvoices = [
  { id: "INV-1055", client: "GreenLeaf", amount: "$4,200", status: "Pending", date: "Mar 28" },
  { id: "INV-1054", client: "CloudNine", amount: "$3,000", status: "Pending", date: "Mar 26" },
  { id: "INV-1042", client: "TechStart", amount: "$3,500", status: "Paid", date: "Mar 15" },
  { id: "INV-1038", client: "Acme Corp", amount: "$2,800", status: "Paid", date: "Feb 15" },
  { id: "INV-1035", client: "BrightWave", amount: "$5,100", status: "Paid", date: "Feb 10" },
];

const subscriptions = [
  { client: "Acme Corp", plan: "Growth Retainer", amount: "$4,500/mo", status: "Active" },
  { client: "TechStart", plan: "SEO Monthly", amount: "$2,500/mo", status: "Active" },
  { client: "GreenLeaf", plan: "Social Management", amount: "$3,200/mo", status: "Active" },
  { client: "CloudNine", plan: "Website Support", amount: "$1,800/mo", status: "Active" },
];

const Billing = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Billing</h1>
            <p className="text-muted-foreground mt-1">Revenue & payment tracking</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary">
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {billingStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5"
            >
              <stat.icon className="w-5 h-5 text-muted-foreground mb-3" />
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoices */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-foreground mb-4">Recent Invoices</h2>
            <div className="space-y-3">
              {recentInvoices.map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">{inv.client} · {inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
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
          </div>

          {/* Subscriptions */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-foreground mb-4">Active Retainers</h2>
            <div className="space-y-3">
              {subscriptions.map((sub, i) => (
                <div key={i} className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-foreground">{sub.client}</h3>
                    <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{sub.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{sub.plan}</p>
                  <p className="text-lg font-heading font-bold text-foreground mt-2">{sub.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Billing;
