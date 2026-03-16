import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  ArrowRightLeft,
  Network,
  Briefcase,
  Map,
  Bot,
  Database,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useTutorialStore } from "@/stores/tutorialStore";
import { useAnalysisStore } from "@/stores/analysisStore";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Oversikt" },
  { to: "/energi", icon: Zap, label: "Energikartlegging", badge: "KI" },
  {
    to: "/materialstrom",
    icon: ArrowRightLeft,
    label: "Materialstrøm",
    badge: "KI",
  },
  { to: "/symbiose", icon: Network, label: "Symbiose", badge: "12" },
  { to: "/forretningscase", icon: Briefcase, label: "Forretningscase" },
  { to: "/kart", icon: Map, label: "Kart" },
  { to: "/prosjektdata", icon: Database, label: "Prosjektdata" },
  { to: "/ki-ekspert", icon: Bot, label: "KI-ekspert", badge: "KI" },
  { to: "/scenarier", icon: FlaskConical, label: "Scenarier" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { splashCompleted, resetTutorial } = useTutorialStore();
  const resetAnalysis = useAnalysisStore((s) => s.resetAll);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#1E293B] border-r border-slate-700/50 transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo Area */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 font-bold text-sm">S</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-sm font-semibold text-slate-100">
                  Sirkulaere Sunndal
                </h1>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Hub KI
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                "hover:bg-slate-700/50",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                  : "text-slate-400 border-l-2 border-transparent"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap flex-1"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {!collapsed && item.badge && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0",
                  item.badge === "KI"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-600/50 text-slate-300"
                )}
              >
                {item.badge}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-700/50 p-3 space-y-3">
        {/* Show Guide Button */}
        {splashCompleted && (
          <button
            onClick={() => { resetTutorial(); resetAnalysis(); }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm",
              "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs whitespace-nowrap overflow-hidden"
                >
                  Vis guide
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Contact */}
        <a
          href="mailto:mhkk@cowi.com"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
            "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors",
            collapsed && "justify-center px-0"
          )}
          title="Kontakt: mhkk@cowi.com"
        >
          <Mail className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs whitespace-nowrap overflow-hidden"
              >
                mhkk@cowi.com
              </motion.span>
            )}
          </AnimatePresence>
        </a>

        {/* AI Status */}
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md",
            collapsed && "justify-center px-0"
          )}
        >
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-emerald-400 font-medium whitespace-nowrap overflow-hidden"
              >
                KI Aktiv
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
