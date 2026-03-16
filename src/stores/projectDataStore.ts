import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectDocument } from "@/types";

/** crypto.randomUUID() requires secure context (HTTPS). Fallback for HTTP. */
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: random hex string
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import {
  setText,
  getText,
  deleteText,
  clearAll as clearAllTexts,
  getAllTexts as getAllTextsFromDB,
} from "@/lib/indexedDBStore";
import {
  parseFile,
  fetchURLContent,
  estimateTokens,
} from "@/lib/documentParser";

/** Per-document text truncation limit (chars). */
const MAX_CHARS_PER_DOC = 200_000;
/** Max file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ProjectDataState {
  documents: ProjectDocument[];
  totalTokens: number;

  // Actions
  addFile: (file: File) => Promise<void>;
  addURL: (url: string) => Promise<void>;
  addManualText: (name: string, text: string) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getDocumentText: (id: string) => Promise<string | undefined>;
  getAllTexts: () => Promise<Map<string, string>>;
}

function recalcTokens(docs: ProjectDocument[]): number {
  return docs
    .filter((d) => d.status === "ready")
    .reduce((sum, d) => sum + d.tokenEstimate, 0);
}

export const useProjectDataStore = create<ProjectDataState>()(
  persist(
    (set, get) => ({
      documents: [],
      totalTokens: 0,

      addFile: async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `Filen er for stor (${(file.size / 1024 / 1024).toFixed(1)} MB). Maks størrelse er 10 MB.`
          );
        }

        const id = generateId();
        const doc: ProjectDocument = {
          id,
          type: "file",
          name: file.name,
          source: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          tokenEstimate: 0,
          status: "processing",
          addedAt: Date.now(),
        };

        set((s) => ({ documents: [...s.documents, doc] }));

        try {
          let text = await parseFile(file);
          if (text.length > MAX_CHARS_PER_DOC) {
            text = text.slice(0, MAX_CHARS_PER_DOC);
          }
          const tokens = estimateTokens(text);
          await setText(id, text);

          set((s) => {
            const docs = s.documents.map((d) =>
              d.id === id
                ? { ...d, status: "ready" as const, tokenEstimate: tokens, sizeBytes: text.length }
                : d
            );
            return { documents: docs, totalTokens: recalcTokens(docs) };
          });
        } catch (err) {
          set((s) => ({
            documents: s.documents.map((d) =>
              d.id === id
                ? {
                    ...d,
                    status: "error" as const,
                    errorMessage:
                      err instanceof Error ? err.message : "Ukjent feil",
                  }
                : d
            ),
          }));
        }
      },

      addURL: async (url: string) => {
        const id = generateId();
        const doc: ProjectDocument = {
          id,
          type: "url",
          name: url,
          source: url,
          sizeBytes: 0,
          tokenEstimate: 0,
          status: "processing",
          addedAt: Date.now(),
        };

        set((s) => ({ documents: [...s.documents, doc] }));

        try {
          const { title, text: rawText } = await fetchURLContent(url);
          let text = rawText;
          if (text.length > MAX_CHARS_PER_DOC) {
            text = text.slice(0, MAX_CHARS_PER_DOC);
          }
          const tokens = estimateTokens(text);
          await setText(id, text);

          set((s) => {
            const docs = s.documents.map((d) =>
              d.id === id
                ? {
                    ...d,
                    name: title || url,
                    status: "ready" as const,
                    tokenEstimate: tokens,
                    sizeBytes: text.length,
                  }
                : d
            );
            return { documents: docs, totalTokens: recalcTokens(docs) };
          });
        } catch (err) {
          set((s) => ({
            documents: s.documents.map((d) =>
              d.id === id
                ? {
                    ...d,
                    status: "error" as const,
                    errorMessage:
                      err instanceof Error ? err.message : "Ukjent feil",
                  }
                : d
            ),
          }));
        }
      },

      addManualText: async (name: string, text: string) => {
        const id = generateId();
        let trimmed = text;
        if (trimmed.length > MAX_CHARS_PER_DOC) {
          trimmed = trimmed.slice(0, MAX_CHARS_PER_DOC);
        }
        const tokens = estimateTokens(trimmed);
        await setText(id, trimmed);

        const doc: ProjectDocument = {
          id,
          type: "text",
          name: name || "Limt inn tekst",
          source: "manuell",
          sizeBytes: trimmed.length,
          tokenEstimate: tokens,
          status: "ready",
          addedAt: Date.now(),
        };

        set((s) => {
          const docs = [...s.documents, doc];
          return { documents: docs, totalTokens: recalcTokens(docs) };
        });
      },

      removeDocument: async (id: string) => {
        await deleteText(id);
        set((s) => {
          const docs = s.documents.filter((d) => d.id !== id);
          return { documents: docs, totalTokens: recalcTokens(docs) };
        });
      },

      clearAll: async () => {
        await clearAllTexts();
        set({ documents: [], totalTokens: 0 });
      },

      getDocumentText: async (id: string) => {
        return getText(id);
      },

      getAllTexts: async () => {
        const docs = get().documents.filter((d) => d.status === "ready");
        const ids = docs.map((d) => d.id);
        return getAllTextsFromDB(ids);
      },
    }),
    {
      name: "suns-project-data",
      // Only persist metadata (documents array), not functions or text
      partialize: (state) => ({
        documents: state.documents,
        totalTokens: state.totalTokens,
      }),
    }
  )
);
