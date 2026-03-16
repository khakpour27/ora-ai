import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageContainer } from "@/components/layout";
import { GlowCard } from "@/components/shared";
import { buildSystemPrompt, buildUserDataContext } from "@/lib/chatSystemPrompt";
import { useProjectDataStore } from "@/stores/projectDataStore";
import { useResolvedData } from "@/hooks/useResolvedData";
import { Link } from "react-router-dom";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Zap,
  Recycle,
  Network,
  Briefcase,
  Lightbulb,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Download,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
  timestamp: Date;
}

/** Parse follow-up questions from the ---FOLLOWUP--- block at end of response */
function parseFollowUps(text: string): { content: string; followUps: string[] } {
  const marker = "---FOLLOWUP---";
  const idx = text.indexOf(marker);
  if (idx === -1) return { content: text.trim(), followUps: [] };

  const mainContent = text.slice(0, idx).trim();
  const followUpBlock = text.slice(idx + marker.length).trim();
  const followUps = followUpBlock
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 0);

  return { content: mainContent, followUps };
}

// ---------------------------------------------------------------------------
// Citation parsing (Perplexity-style source badges)
// ---------------------------------------------------------------------------

interface ParsedSource {
  id: number;
  source: string;
  shortName: string;
  page?: string;
  date?: string;
  confidence: "verified" | "estimated" | "projected";
}

function getShortSourceName(source: string): string {
  if (source.includes("Mepex")) {
    const after = source.match(/[–-]\s*(.+)/)?.[1];
    if (after) return `Mepex–${after.split(/\s+/)[0]}`;
    return "Mepex";
  }
  if (source.includes("Avslutningsrapport")) return "Avslutningsrapp.";
  if (source.includes("Konkurransegrunnlag")) return "Konkurransegrunn.";
  if (source.toLowerCase().includes("søknad") || source.toLowerCase().includes("soknad"))
    return "Søkn. Skaparkraft";
  if (source.includes("SUNS")) return "SUNS nettsted";
  if (source.includes("Helhetlige")) return "Helhetlige Symb.";
  return source.split(/\s+/).slice(0, 2).join(" ");
}

function parseCitations(text: string): { content: string; sources: ParsedSource[] } {
  const citationRegex = /\(📎\s*([^)]+)\)/g;
  const sourceMap = new Map<string, ParsedSource>();
  let idCounter = 0;

  // First pass: collect unique sources
  let m;
  const r1 = new RegExp(citationRegex.source, citationRegex.flags);
  while ((m = r1.exec(text)) !== null) {
    const inner = m[1];
    const confMatch = inner.match(/\[(verified|estimated|projected)\]/);
    const confidence = (confMatch?.[1] || "estimated") as ParsedSource["confidence"];
    let rest = inner.replace(/,?\s*\[(?:verified|estimated|projected)\]\s*/, "").trim();
    if (rest.endsWith(",")) rest = rest.slice(0, -1).trim();
    const parts = rest.split(",").map((s) => s.trim());
    const srcName = parts[0];
    if (!sourceMap.has(srcName)) {
      idCounter++;
      sourceMap.set(srcName, {
        id: idCounter,
        source: srcName,
        shortName: getShortSourceName(srcName),
        page: parts.find((p) => p.startsWith("s.")),
        date: parts.find((p) => /^\d{4}/.test(p)),
        confidence,
      });
    }
  }

  // Second pass: replace citations with tokens, deduplicating per paragraph
  // (same source can reappear in a new paragraph, but not repeated within one)
  const paragraphs = text.split(/\n\n/);
  const processed = paragraphs.map((para) => {
    const citedInPara = new Set<number>();
    return para.replace(citationRegex, (_, inner: string) => {
      let rest = inner.replace(/,?\s*\[(?:verified|estimated|projected)\]\s*/, "").trim();
      if (rest.endsWith(",")) rest = rest.slice(0, -1).trim();
      const srcName = rest.split(",").map((s) => s.trim())[0];
      const s = sourceMap.get(srcName);
      if (!s) return "";
      if (citedInPara.has(s.id)) return ""; // skip duplicate within same paragraph
      citedInPara.add(s.id);
      return `%%CITE:${s.id}:${encodeURIComponent(s.shortName)}:${s.confidence}%%`;
    });
  });
  const content = processed.join("\n\n");

  return { content, sources: Array.from(sourceMap.values()) };
}

/** Replace %%CITE:id:name:conf%% tokens with styled inline badges */
function renderCitationBadges(html: string): string {
  return html.replace(/%%CITE:(\d+):([^:]+):(\w+)%%/g, (_, _id, encodedName, conf) => {
    const name = decodeURIComponent(encodedName);
    const dotColor =
      conf === "verified" ? "#10B981" : conf === "projected" ? "#8B5CF6" : "#F59E0B";
    return `<span style="display:inline-flex;align-items:center;gap:3px;padding:1px 7px 1px 5px;margin:0 2px;border-radius:4px;background:rgba(51,65,85,0.5);border:1px solid rgba(71,85,105,0.4);font-family:ui-monospace,SFMono-Regular,monospace;font-size:10px;line-height:16px;color:rgb(148,163,184);vertical-align:middle;cursor:default;white-space:nowrap"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${dotColor};flex-shrink:0"></span>${name}</span>`;
  });
}

interface SuggestedQuestion {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  question: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Suggested questions
// ---------------------------------------------------------------------------

const suggestedQuestions: SuggestedQuestion[] = [
  {
    icon: Zap,
    label: "Energi",
    question:
      "Hva er det totale spillvarmepotensialet fra Hydro Sunndal, og hvor mye utnyttes i dag?",
    color: "text-amber-400",
  },
  {
    icon: Recycle,
    label: "Material",
    question:
      "Hvilke materialstrommer mellom bedriftene har hoyest matchscore og størst volum?",
    color: "text-emerald-400",
  },
  {
    icon: Network,
    label: "Symbiose",
    question:
      "Ranger de 5 mest lovende symbosemulighetene basert pa verdi og gjennomforbarhet.",
    color: "text-violet-400",
  },
  {
    icon: Briefcase,
    label: "Business",
    question:
      "Hvilken forretningscase har best ROI og korteste tilbakebetalingstid?",
    color: "text-sky-400",
  },
  {
    icon: Lightbulb,
    label: "Strategi",
    question:
      "Hva bør være førsteprioriteten for Sirkulære Sunndal Hub det neste året?",
    color: "text-rose-400",
  },
  {
    icon: Sparkles,
    label: "Biokarbon",
    question:
      "Forklar biokarboncasen (AP4) og dens potensial for CO2-reduksjon hos Hydro.",
    color: "text-teal-400",
  },
];

// ---------------------------------------------------------------------------
// Gemini API integration (streaming)
// ---------------------------------------------------------------------------

// Read API key from runtime config (Docker/Dokploy) or build-time env (local dev)
function getGeminiApiKey(): string | undefined {
  const runtimeKey = (
    window as unknown as {
      __RUNTIME_CONFIG__?: { VITE_GEMINI_API_KEY?: string };
    }
  ).__RUNTIME_CONFIG__?.VITE_GEMINI_API_KEY;
  if (runtimeKey) return runtimeKey;
  const buildKey = import.meta.env.VITE_GEMINI_API_KEY;
  return buildKey || undefined;
}

const GEMINI_API_KEY = getGeminiApiKey();

async function streamGemini(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.95,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: { message?: string } })?.error?.message ||
        `API-feil: ${response.status}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Ingen stream tilgjengelig.");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process SSE lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const data = JSON.parse(jsonStr) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          onChunk(text);
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Lightweight markdown renderer
// ---------------------------------------------------------------------------

function MarkdownContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const html = text
    // Code blocks (```)
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-slate-900/80 border border-slate-700/50 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-slate-300"><code>$2</code></pre>'
    )
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 bg-slate-900/60 border border-slate-700/40 rounded text-xs font-mono text-violet-300">$1</code>'
    )
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
    // Headers (## and ###)
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-slate-100 mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-slate-100 mt-4 mb-1.5">$1</h3>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300 mb-0.5"><span>$2</span></li>')
    // Bullet lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-slate-300 mb-0.5"><span>$1</span></li>')
    // Wrap consecutive <li> in <ul>/<ol>
    .replace(/((?:<li class="ml-4 list-(?:disc|decimal)[^"]*">.*?<\/li>\n?)+)/g, '<ul class="my-1.5 space-y-0.5">$1</ul>')
    // Line breaks (preserve paragraphs)
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, "<br/>");

  // Replace citation tokens with Perplexity-style inline badges
  const finalHtml = renderCitationBadges(html);

  return (
    <div
      className={cn(
        "prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:my-1.5 [&_ol]:my-1.5",
        streaming && "[&_*]:transition-opacity [&_*]:duration-300 [&_*]:ease-in-out"
      )}
      style={streaming ? { transition: "max-height 0.3s ease" } : undefined}
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${finalHtml}</p>` }}
    />
  );
}

// ---------------------------------------------------------------------------
// Sources bar (Perplexity-style compact source cards above response)
// ---------------------------------------------------------------------------

function SourcesBar({ sources }: { sources: ParsedSource[] }) {
  if (sources.length === 0) return null;

  const confLabel = (c: string) =>
    c === "verified" ? "Verifisert" : c === "projected" ? "Anslått" : "Estimert";
  const confDot = (c: string) =>
    c === "verified"
      ? "bg-emerald-400"
      : c === "projected"
        ? "bg-violet-400"
        : "bg-amber-400";

  return (
    <div className="mb-3 pb-3 border-b border-slate-700/30">
      <div className="flex items-center gap-1.5 mb-2">
        <FileText className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          {sources.length} {sources.length === 1 ? "kilde" : "kilder"}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {sources.map((s) => (
          <div
            key={s.id}
            className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/50 border border-slate-700/30 cursor-default group"
            title={`${s.source}${s.page ? ", " + s.page : ""}${s.date ? ", " + s.date : ""} [${s.confidence}]`}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                confDot(s.confidence)
              )}
            />
            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
              {s.shortName}
            </span>
            <span className="text-[9px] text-slate-600 whitespace-nowrap hidden group-hover:inline">
              {confLabel(s.confidence)}
              {s.date && ` · ${s.date}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data shortcuts — detect keywords and link to relevant pages
// ---------------------------------------------------------------------------

interface PageShortcut {
  label: string;
  path: string;
  keywords: RegExp;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const pageShortcuts: PageShortcut[] = [
  {
    label: "Energikartlegging",
    path: "/energi",
    keywords: /energi|spillvarme|fjernvarme|kraftnett|GWh|str.m|varmepumpe/i,
    icon: Zap,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    label: "Materialstrøm",
    path: "/materialstrom",
    keywords: /material|avfall|slagg|resirkul|tonn\/|SPL|biokarbon|plast|trevirke|katode/i,
    icon: Recycle,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    label: "Symbiose",
    path: "/symbiose",
    keywords: /symbios|sym-\d|mulighet|samarbeid|industriell.*symbiose/i,
    icon: Network,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    label: "Forretningscase",
    path: "/forretningscase",
    keywords: /forretningscase|ROI|NPV|IRR|investering|tilbakebetaling|finansier/i,
    icon: Briefcase,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
];

function DataShortcuts({ content }: { content: string }) {
  const matched = pageShortcuts.filter((s) => s.keywords.test(content));
  if (matched.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="text-[10px] text-slate-500 self-center mr-1">Se data:</span>
      {matched.map((s) => (
        <Link
          key={s.path}
          to={s.path}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border",
            "hover:brightness-125 transition-all duration-200",
            s.color
          )}
        >
          <s.icon className="w-3 h-3" />
          {s.label}
          <ExternalLink className="w-2.5 h-2.5 opacity-50" />
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble component
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
  onFollowUp?: (question: string) => void;
}

function MessageBubble({ message, isLast, onFollowUp }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  // Parse citations for assistant messages
  const { content: citedContent, sources } = useMemo(
    () =>
      isUser
        ? { content: message.content, sources: [] as ParsedSource[] }
        : parseCitations(message.content),
    [message.content, isUser]
  );

  const handleCopy = useCallback(async () => {
    const clean = message.content
      .replace(/\(📎\s*[^)]+\)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    try {
      await navigator.clipboard.writeText(clean);
    } catch {
      // Fallback for non-secure contexts (HTTP / traefik.me)
      const ta = document.createElement("textarea");
      ta.value = clean;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleDownload = useCallback(() => {
    let text = message.content
      .replace(/\(📎\s*[^)]+\)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (sources.length > 0) {
      text += "\n\n---\nKilder:\n";
      sources.forEach((s) => {
        text += `${s.id}. ${s.source}`;
        if (s.date) text += ` (${s.date})`;
        if (s.page) text += `, ${s.page}`;
        text += ` — ${s.confidence}\n`;
      });
    }
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ki-svar-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [message.content, sources]);

  return (
    <div className="space-y-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-violet-500/20 text-violet-400"
          )}
        >
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message */}
        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-emerald-500/15 border border-emerald-500/20 text-slate-100"
              : "bg-slate-800/80 border border-slate-700/50 text-slate-200"
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <>
              <SourcesBar sources={sources} />
              <MarkdownContent text={citedContent} />
            </>
          )}
          <div
            className={cn(
              "text-[10px] mt-1.5 flex items-center",
              isUser
                ? "text-emerald-500/50 justify-end"
                : "text-slate-500 justify-between"
            )}
          >
            <span>
              {message.timestamp.toLocaleTimeString("nb-NO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {!isUser && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Kopier svar"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Last ned som Markdown"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Follow-up questions */}
      {!isUser && isLast && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="ml-11 space-y-2"
        >
          {/* Data shortcut links */}
          <DataShortcuts content={message.content} />

          {/* Follow-up questions */}
          {message.followUps && message.followUps.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500">Relaterte spørsmål:</span>
              {message.followUps.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp?.(q)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs text-left",
                    "bg-violet-500/10 border border-violet-500/20",
                    "text-violet-300 hover:bg-violet-500/20 hover:text-violet-200",
                    "transition-all duration-200"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator with funny verbs
// ---------------------------------------------------------------------------

const thinkingVerbs = [
  "Fjernvarmer...",
  "Elektrifiserer...",
  "Symbioserer...",
  "Resirkulerer...",
  "Smelter aluminium...",
  "Kartlegger spillvarme...",
  "Sirkulærøkonomiserer...",
  "Biokarbonifiserer...",
  "Optimaliserer energistrømmer...",
  "Analyserer materialstrømmer...",
  "Dekarboniserer...",
  "Slaggknuser...",
  "Nettverkskobler...",
  "Sankey-diagrammerer...",
  "KI-tenker...",
  "Industriell-symbioserer...",
  "Beregner NPV...",
  "Varmegjenvinner...",
  "Søker i avfallsstrømmer...",
];

function TypingIndicator() {
  const [verbIndex, setVerbIndex] = useState(
    () => Math.floor(Math.random() * thinkingVerbs.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setVerbIndex((prev) => {
        let next: number;
        do {
          next = Math.floor(Math.random() * thinkingVerbs.length);
        } while (next === prev && thinkingVerbs.length > 1);
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-violet-400" />
      </div>
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-violet-400/60"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={verbIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-violet-300/70 italic"
          >
            {thinkingVerbs[verbIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hubData = useResolvedData();
  const scenarioContext = hubData.isScenario && hubData.scenarioName
    ? `Scenario "${hubData.scenarioName}" er aktivt. Data nedenfor reflekterer scenariomutasjonene.`
    : undefined;
  const staticPrompt = useMemo(
    () => buildSystemPrompt(hubData, scenarioContext),
    [hubData, scenarioContext]
  );

  // Project data store — for dynamic user uploads
  const projectDocuments = useProjectDataStore((s) => s.documents);
  const getAllTexts = useProjectDataStore((s) => s.getAllTexts);
  const projectDocCount = projectDocuments.filter((d) => d.status === "ready").length;

  // Throttled streaming: accumulate raw text in ref, flush to state at intervals
  const streamBufferRef = useRef("");
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const THROTTLE_MS = 200;

  const flushStreamBuffer = useCallback(() => {
    setStreamingContent(streamBufferRef.current);
    throttleTimerRef.current = null;
  }, []);

  const appendStreamChunk = useCallback(
    (chunk: string) => {
      streamBufferRef.current += chunk;
      if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(flushStreamBuffer, THROTTLE_MS);
      }
    },
    [flushStreamBuffer]
  );

  // Memoize the markdown-rendered streaming content so we don't re-parse on every render
  const streamingHtml = useMemo(() => {
    if (!streamingContent) return "";
    // Strip incomplete FOLLOWUP block and incomplete citations during streaming
    const cleaned = streamingContent
      .replace(/---FOLLOWUP---[\s\S]*$/, "")
      .replace(/\(📎[^)]*$/, "")
      .trim();
    return cleaned;
  }, [streamingContent]);

  // Parse citations from streaming content for live badge rendering
  const streamingParsed = useMemo(() => {
    if (!streamingHtml) return { content: "", sources: [] as ParsedSource[] };
    return parseCitations(streamingHtml);
  }, [streamingHtml]);

  const apiKeyMissing = !GEMINI_API_KEY;

  // Scroll to bottom on new messages or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, streamingContent]);

  // Auto-resize textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setError(null);
      setIsLoading(true);
      setStreamingContent("");
      streamBufferRef.current = "";
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      try {
        abortRef.current = new AbortController();
        const allMessages = [...messages, userMessage];

        // Build system prompt: static project data + dynamic user uploads
        let fullPrompt = staticPrompt;
        const userTexts = await getAllTexts();
        if (userTexts.size > 0) {
          fullPrompt += buildUserDataContext(projectDocuments, userTexts);
        }

        await streamGemini(
          allMessages,
          fullPrompt,
          (chunk) => {
            appendStreamChunk(chunk);
          },
          abortRef.current.signal
        );

        // Final flush — ensure all buffered content is displayed
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
        const accumulated = streamBufferRef.current;
        if (!accumulated) throw new Error("Tomt svar fra KI-modellen.");

        const { content: parsedContent, followUps } = parseFollowUps(accumulated);

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: parsedContent,
          followUps,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
        streamBufferRef.current = "";
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorMsg =
          err instanceof Error && err.message === "GEMINI_API_KEY_MISSING"
            ? "Gemini API-nokkel mangler. Sett VITE_GEMINI_API_KEY i miljovariabler."
            : err instanceof Error
              ? err.message
              : "Ukjent feil oppstod.";
        setError(errorMsg);
        setStreamingContent("");
        streamBufferRef.current = "";
      } finally {
        setIsLoading(false);
        abortRef.current = null;
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
      }
    },
    [messages, isLoading, appendStreamChunk, getAllTexts, projectDocuments]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const handleSuggestedClick = useCallback(
    (question: string) => {
      sendMessage(question);
    },
    [sendMessage]
  );

  const handleReset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setStreamingContent("");
    streamBufferRef.current = "";
    setInput("");
  }, []);

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <PageContainer
      title="KI-ekspert"
      description="Still spørsmål om energi, materialstrømmer, symbiose og forretningscaser"
    >
      <div className="flex flex-col h-[calc(100vh-180px)] gap-4">
        {/* API Key Warning */}
        {apiKeyMissing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Gemini API-nokkel er ikke konfigurert. Sett{" "}
              <code className="px-1.5 py-0.5 bg-amber-500/10 rounded text-xs font-mono">
                VITE_GEMINI_API_KEY
              </code>{" "}
              som miljovariabler for a aktivere KI-chat.
            </span>
          </motion.div>
        )}

        {/* Chat Area */}
        <GlowCard className="flex-1 flex flex-col overflow-hidden !p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                {/* Welcome */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Hei! Jeg er din KI-ekspert.
                  </h2>
                  <p className="text-sm text-slate-400 max-w-md">
                    Jeg har tilgang til all prosjektdata for Sirkulaere Sunndal
                    Hub. Still meg spørsmål om energi, materialstrommer,
                    symbiosemuligheter eller forretningscaser.
                  </p>
                  {projectDocCount > 0 && (
                    <Link
                      to="/prosjektdata"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      {projectDocCount} dokument{projectDocCount !== 1 ? "er" : ""} tilgjengelig
                    </Link>
                  )}
                </motion.div>

                {/* Suggested questions */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl"
                >
                  {suggestedQuestions.map((sq, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                      onClick={() => handleSuggestedClick(sq.question)}
                      disabled={isLoading || apiKeyMissing}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl text-left",
                        "bg-slate-800/60 border border-slate-700/50",
                        "hover:bg-slate-700/60 hover:border-slate-600/50",
                        "transition-all duration-200 group",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <sq.icon
                        className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          sq.color
                        )}
                      />
                      <div>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider",
                            sq.color
                          )}
                        >
                          {sq.label}
                        </span>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed group-hover:text-slate-100 transition-colors">
                          {sq.question}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isLast={idx === messages.length - 1 && !isLoading}
                    onFollowUp={handleSuggestedClick}
                  />
                ))}

                {/* Streaming response — markdown rendered with throttled updates */}
                {streamingHtml && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-violet-400" />
                    </div>
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-slate-800/80 border border-slate-700/50 text-slate-200"
                      style={{ transition: "height 0.3s ease, min-height 0.3s ease" }}
                    >
                      {streamingParsed.sources.length > 0 && (
                        <SourcesBar sources={streamingParsed.sources} />
                      )}
                      <MarkdownContent text={streamingParsed.content} streaming />
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-400/70 animate-pulse align-middle" />
                    </div>
                  </motion.div>
                )}

                {/* Typing indicator (before first chunk arrives) */}
                <AnimatePresence>
                  {isLoading && !streamingHtml && <TypingIndicator />}
                </AnimatePresence>
              </>
            )}

            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-slate-700/50 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    apiKeyMissing
                      ? "Konfigurer VITE_GEMINI_API_KEY for a starte..."
                      : "Still et spørsmål om prosjektdata..."
                  }
                  disabled={apiKeyMissing}
                  rows={1}
                  className={cn(
                    "w-full resize-none rounded-xl px-4 py-3 text-sm",
                    "bg-slate-800/80 border border-slate-700/50",
                    "text-slate-100 placeholder:text-slate-500",
                    "focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200"
                  )}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className={cn(
                      "p-3 rounded-xl",
                      "bg-slate-800/80 border border-slate-700/50",
                      "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60",
                      "transition-all duration-200"
                    )}
                    title="Ny samtale"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || apiKeyMissing}
                  className={cn(
                    "p-3 rounded-xl transition-all duration-200",
                    input.trim() && !isLoading && !apiKeyMissing
                      ? "bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30"
                      : "bg-slate-800/80 border border-slate-700/50 text-slate-600 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            {/* Footer hint */}
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <MessageSquare className="w-3 h-3" />
                <span>Shift+Enter for ny linje</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <Sparkles className="w-3 h-3" />
                <span>Drevet av Google Gemini</span>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>
    </PageContainer>
  );
}
