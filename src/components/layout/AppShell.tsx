import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ScenarioPanel } from "@/components/shared/ScenarioPanel";
import { useHubData, useIsHubReady } from "@/hooks/useHubData";

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Trigger hub data loading on mount (runs the useEffect inside)
  useHubData();
  const hubReady = useIsHubReady();

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {hubReady ? (
            <Outlet />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
                <span className="text-sm">Laster data...</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Scenario Panel (global overlay) */}
      <ScenarioPanel />
    </div>
  );
}
