import { useState, useRef, useCallback } from "react";
import { Download, Image, FileImage, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface ChartExportMenuProps {
  /** Ref to the chart container element to export */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Base filename without extension */
  filename?: string;
}

const EXPORT_OPTIONS = [
  { id: "png", label: "PNG", icon: Image, description: "Bilde (høy oppløsning)" },
  { id: "svg", label: "SVG", icon: FileImage, description: "Vektorgrafikk" },
  { id: "pdf", label: "PDF", icon: FileText, description: "PDF-dokument" },
] as const;

type ExportFormat = (typeof EXPORT_OPTIONS)[number]["id"];

export function ChartExportMenu({ targetRef, filename = "chart" }: ChartExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!targetRef.current) return;
      setExporting(format);

      try {
        const { exportAsPNG, exportAsSVG, exportAsPDF } = await import("@/lib/chartExporter");

        switch (format) {
          case "png":
            await exportAsPNG(targetRef.current, filename);
            break;
          case "svg":
            await exportAsSVG(targetRef.current, filename);
            break;
          case "pdf":
            await exportAsPDF(targetRef.current, filename);
            break;
        }
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setExporting(null);
        setIsOpen(false);
      }
    },
    [targetRef, filename]
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200",
          isOpen
            ? "bg-emerald-500/20 text-emerald-400"
            : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/40"
        )}
        title="Eksporter diagram"
      >
        <Download className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-xl overflow-hidden"
            >
              <div className="p-1">
                {EXPORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isExporting = exporting === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleExport(option.id)}
                      disabled={exporting !== null}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left hover:bg-slate-700/40 transition-colors disabled:opacity-50"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 text-slate-400" />
                      )}
                      <div>
                        <p className="text-sm text-slate-200">{option.label}</p>
                        <p className="text-[10px] text-slate-500">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
