/**
 * Thin IndexedDB wrapper for storing extracted document text.
 * Metadata lives in Zustand/localStorage; full text lives here
 * because localStorage is capped at 5-10 MB.
 */

const DB_NAME = "suns-project-data";
const STORE_NAME = "documents";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<unknown> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE_NAME, mode);
        const store = t.objectStore(STORE_NAME);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        t.oncomplete = () => db.close();
      })
  );
}

export async function getText(id: string): Promise<string | undefined> {
  const result = await tx("readonly", (s) => s.get(id));
  return result as string | undefined;
}

export async function setText(id: string, text: string): Promise<void> {
  await tx("readwrite", (s) => s.put(text, id));
}

export async function deleteText(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function clearAll(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}

export async function getAllTexts(
  ids: string[]
): Promise<Map<string, string>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, "readonly");
    const store = t.objectStore(STORE_NAME);
    const result = new Map<string, string>();

    let remaining = ids.length;
    if (remaining === 0) {
      db.close();
      resolve(result);
      return;
    }

    for (const id of ids) {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) result.set(id, req.result as string);
        remaining--;
        if (remaining === 0) resolve(result);
      };
      req.onerror = () => reject(req.error);
    }

    t.oncomplete = () => db.close();
  });
}
