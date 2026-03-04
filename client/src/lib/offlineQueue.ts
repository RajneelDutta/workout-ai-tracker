const DB_NAME = "workout-offline";
const STORE_NAME = "pending-sets";
const DB_VERSION = 1;

type PendingSet = {
  id?: number;
  exerciseId: number;
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  timestamp: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueSet(set: Omit<PendingSet, "id" | "timestamp">) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({ ...set, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSets(): Promise<PendingSet[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearPendingSets() {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushQueue(
  logSet: (data: {
    exerciseId: number;
    setNumber: number;
    reps?: number;
    weight?: number;
    rpe?: number;
  }) => Promise<any>
) {
  const pending = await getPendingSets();
  if (pending.length === 0) return 0;

  let flushed = 0;
  for (const set of pending) {
    try {
      await logSet({
        exerciseId: set.exerciseId,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight,
        rpe: set.rpe,
      });
      flushed++;
    } catch {
      break; // Stop on first failure, try again later
    }
  }

  if (flushed === pending.length) {
    await clearPendingSets();
  }
  return flushed;
}
