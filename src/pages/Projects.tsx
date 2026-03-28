import { motion } from "framer-motion";
import { Plus, Clock, CheckCircle2, Circle } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const projects = [
  {
    name: "Brand Redesign",
    client: "Acme Corp",
    progress: 75,
    status: "In Progress",
    milestones: [
      { name: "Discovery", done: true },
      { name: "Design", done: true },
      { name: "Development", done: false },
      { name: "Launch", done: false },
    ],
  },
  {
    name: "SEO Optimization",
    client: "TechStart",
    progress: 40,
    status: "In Progress",
    milestones: [
      { name: "Audit", done: true },
      { name: "On-Page", done: false },
      { name: "Off-Page", done: false },
      { name: "Report", done: false },
    ],
  },
  {
    name: "Social Campaign",
    client: "GreenLeaf",
    progress: 90,
    status: "Review",
    milestones: [
      { name: "Strategy", done: true },
      { name: "Content", done: true },
      { name: "Scheduling", done: true },
      { name: "Go Live", done: false },
    ],
  },
  {
    name: "Website Rebuild",
    client: "CloudNine",
    progress: 20,
    status: "In Progress",
    milestones: [
      { name: "Wireframes", done: true },
      { name: "Design", done: false },
      { name: "Dev", done: false },
      { name: "QA", done: false },
    ],
  },
];

const Projects = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">{projects.length} active projects</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  project.status === "Review"
                    ? "bg-warning/10 text-warning"
                    : "bg-primary/10 text-primary"
                }`}>
                  {project.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="flex gap-3">
                {project.milestones.map((m, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-xs">
                    {m.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={m.done ? "text-foreground" : "text-muted-foreground"}>{m.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Projects;
