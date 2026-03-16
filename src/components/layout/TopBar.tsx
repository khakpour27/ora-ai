import { useLocation } from "react-router-dom";
import { Bell, Settings, ShieldCheck } from "lucide-react";

const routeNames: Record<string, string> = {
  "/": "Oversikt",
  "/energi": "Energikartlegging",
  "/materialstrom": "Materialstrøm",
  "/symbiose": "Symbiose",
  "/forretningscase": "Forretningscase",
  "/kart": "Kart",
  "/ki-ekspert": "KI-ekspert",
  "/prosjektdata": "Prosjektdata",
  "/scenarier": "Scenario Lab",
};

export function TopBar() {
  const location = useLocation();
  const currentPage = routeNames[location.pathname] ?? "Ukjent side";

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-slate-700/50 glass-card rounded-none border-x-0 border-t-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">SymbioLink Øra</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{currentPage}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* AI Confidence Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">94%</span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          aria-label="Varsler"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          aria-label="Innstillinger"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
