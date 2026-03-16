import { useState, useCallback, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout";
import { GlowCard, SectionHeader } from "@/components/shared";
import {
  useProjectDataStore,
  MAX_FILE_SIZE,
} from "@/stores/projectDataStore";
import type { ProjectDocument } from "@/types";
import {
  FileUp,
  Link2,
  Trash2,
  FileText,
  Globe,
  AlignLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  X,
  ClipboardPaste,
  TableProperties,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabId = "filer" | "lenker" | "strukturert";

const tabs: { id: TabId; label: string; icon: typeof FileUp }[] = [
  { id: "filer", label: "Filer", icon: FileUp },
  { id: "lenker", label: "Lenker & Tekst", icon: Link2 },
  { id: "strukturert", label: "Strukturerte data", icon: TableProperties },
];

const StructuredDataTab = lazy(() =>
  import("@/components/data-editor/StructuredDataTab").then((m) => ({ default: m.StructuredDataTab }))
);

const ACCEPTED_EXTENSIONS = ".pdf,.txt,.md,.csv,.tsv,.json,.xml";
const MAX_TOKEN_BUDGET = 998_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

function statusIcon(status: ProjectDocument["status"]) {
  switch (status) {
    case "processing":
      return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
    case "ready":
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case "error":
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
  }
}

function typeIcon(type: ProjectDocument["type"]) {
  switch (type) {
    case "file":
      return <FileText className="w-4 h-4 text-slate-400" />;
    case "url":
      return <Globe className="w-4 h-4 text-violet-400" />;
    case "text":
      return <AlignLeft className="w-4 h-4 text-cyan-400" />;
  }
}

// ---------------------------------------------------------------------------
// Token Budget Bar
// ---------------------------------------------------------------------------

function TokenBudgetBar({
  totalTokens,
}: {
  totalTokens: number;
}) {
  const pct = Math.min((totalTokens / MAX_TOKEN_BUDGET) * 100, 100);
  const color =
    pct > 90
      ? "bg-rose-500"
      : pct > 70
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <GlowCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">
            Token-budsjett
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {formatTokens(totalTokens)} / {formatTokens(MAX_TOKEN_BUDGET)} tokens
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5">
        Tilgjengelig for KI-kontekst. Data sendes til Gemini ved hver chat-melding.
      </p>
    </GlowCard>
  );
}

// ---------------------------------------------------------------------------
// Document List
// ---------------------------------------------------------------------------

function DocumentList({
  documents,
  onRemove,
}: {
  documents: ProjectDocument[];
  onRemove: (id: string) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Database className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-sm">Ingen dokumenter lastet opp ennå</p>
        <p className="text-xs mt-1">Last opp filer eller legg til lenker for å gi KI-eksperten kontekst</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 group"
          >
            {typeIcon(doc.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 truncate">{doc.name}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                {doc.status === "ready" && (
                  <>
                    <span>{formatBytes(doc.sizeBytes)}</span>
                    <span className="font-mono">~{formatTokens(doc.tokenEstimate)} tokens</span>
                  </>
                )}
                {doc.status === "error" && (
                  <span className="text-rose-400">{doc.errorMessage}</span>
                )}
                {doc.status === "processing" && (
                  <span className="text-amber-400">Behandler...</span>
                )}
                <span className="text-slate-600">
                  {new Date(doc.addedAt).toLocaleDateString("nb-NO")}
                </span>
              </div>
            </div>
            {statusIcon(doc.status)}
            <button
              onClick={() => onRemove(doc.id)}
              className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Fjern dokument"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File Drop Zone
// ---------------------------------------------------------------------------

function FileDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFile = useProjectDataStore((s) => s.addFile);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null);
      const arr = Array.from(files);
      for (const file of arr) {
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(
            `"${file.name}" er for stor (${(file.size / 1024 / 1024).toFixed(1)} MB). Maks 10 MB.`
          );
          continue;
        }
        try {
          await addFile(file);
        } catch (err) {
          setUploadError(
            err instanceof Error ? err.message : "Feil ved opplasting"
          );
        }
      }
    },
    [addFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
          isDragging
            ? "border-emerald-400 bg-emerald-500/10"
            : "border-slate-600/50 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50"
        )}
      >
        <motion.div
          animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isDragging ? "bg-emerald-500/20" : "bg-slate-700/50"
          )}
        >
          <FileUp
            className={cn(
              "w-6 h-6",
              isDragging ? "text-emerald-400" : "text-slate-400"
            )}
          />
        </motion.div>
        <div className="text-center">
          <p className="text-sm text-slate-200">
            {isDragging
              ? "Slipp filen her"
              : "Dra og slipp filer her, eller klikk for å velge"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PDF, TXT, MD, CSV, JSON — maks 10 MB per fil
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1">{uploadError}</span>
            <button onClick={() => setUploadError(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// URL Input Section
// ---------------------------------------------------------------------------

function URLInputSection() {
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const addURL = useProjectDataStore((s) => s.addURL);

  const handleAddURL = useCallback(async () => {
    if (!url.trim()) return;
    // Basic URL validation
    let normalized = url.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = "https://" + normalized;
    }
    try {
      new URL(normalized);
    } catch {
      setUrlError("Ugyldig URL-format");
      return;
    }

    setUrlLoading(true);
    setUrlError(null);
    try {
      await addURL(normalized);
      setUrl("");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Feil ved henting");
    } finally {
      setUrlLoading(false);
    }
  }, [url, addURL]);

  return (
    <div className="space-y-4">
      {/* URL input */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          Legg til nettside-URL
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddURL();
              }}
              placeholder="https://example.com/dokument"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={handleAddURL}
            disabled={!url.trim() || urlLoading}
            className={cn(
              "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
              url.trim() && !urlLoading
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-slate-700/30 text-slate-600 cursor-not-allowed"
            )}
          >
            {urlLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Hent
          </button>
        </div>
        <AnimatePresence>
          {urlError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-rose-400 flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3 h-3" />
              {urlError}
            </motion.p>
          )}
        </AnimatePresence>
        <p className="text-[11px] text-slate-600">
          Innhold hentes via CORS-proxy. Noen sider kan blokkere henting — bruk manuell lim-inn i så fall.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual Text Input Section
// ---------------------------------------------------------------------------

function ManualTextSection() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const addManualText = useProjectDataStore((s) => s.addManualText);

  const handleAdd = useCallback(async () => {
    if (!text.trim()) return;
    await addManualText(name.trim() || "Limt inn tekst", text.trim());
    setName("");
    setText("");
    setIsOpen(false);
  }, [name, text, addManualText]);

  return (
    <div className="space-y-2">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors"
        >
          <ClipboardPaste className="w-4 h-4" />
          Lim inn tekst manuelt
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/40"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Manuell tekst
            </label>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tittel (valgfritt)"
            className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Lim inn tekst her..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              {text.length > 0
                ? `~${formatTokens(Math.ceil(text.length / 4))} tokens`
                : ""}
            </span>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                text.trim()
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "bg-slate-700/30 text-slate-600 cursor-not-allowed"
              )}
            >
              <AlignLeft className="w-4 h-4" />
              Legg til
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ProjectDataPage() {
  const [activeTab, setActiveTab] = useState<TabId>("filer");
  const { documents, totalTokens, removeDocument, clearAll } =
    useProjectDataStore();

  const handleClearAll = useCallback(async () => {
    if (
      documents.length > 0 &&
      window.confirm(
        `Er du sikker på at du vil fjerne alle ${documents.length} dokumenter?`
      )
    ) {
      await clearAll();
    }
  }, [documents.length, clearAll]);

  return (
    <PageContainer
      title="Prosjektdata"
      description="Last opp dokumenter og lenker som blir tilgjengelig for KI-eksperten"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Token Budget Bar */}
        <motion.div variants={staggerItem}>
          <TokenBudgetBar totalTokens={totalTokens} />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {documents.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Fjern alle
            </button>
          )}
        </motion.div>

        {/* Tab Content */}
        <motion.div variants={staggerItem}>
          <GlowCard className="p-5">
            {activeTab === "filer" && (
              <div className="space-y-5">
                <SectionHeader
                  title="Last opp filer"
                  description="PDF, TXT, MD, CSV og JSON-filer. Teksten trekkes ut automatisk."
                />
                <FileDropZone />
              </div>
            )}

            {activeTab === "lenker" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Nettsider og tekst"
                  description="Hent innhold fra URL-er eller lim inn tekst direkte."
                />
                <URLInputSection />
                <div className="border-t border-slate-700/40 pt-4">
                  <ManualTextSection />
                </div>
              </div>
            )}

            {activeTab === "strukturert" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Laster editor...</span>
                  </div>
                }
              >
                <StructuredDataTab />
              </Suspense>
            )}
          </GlowCard>
        </motion.div>

        {/* Document List */}
        <motion.div variants={staggerItem}>
          <GlowCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader
                title="Opplastede dokumenter"
                description={
                  documents.length > 0
                    ? `${documents.length} dokument${documents.length !== 1 ? "er" : ""} — ~${formatTokens(totalTokens)} tokens totalt`
                    : "Ingen dokumenter ennå"
                }
              />
            </div>
            <DocumentList
              documents={documents}
              onRemove={(id) => removeDocument(id)}
            />
          </GlowCard>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
