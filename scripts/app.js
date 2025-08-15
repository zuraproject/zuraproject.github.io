// scripts/app.js
export const dbName = 'zuraMediaDB';
export const storeName = 'mediaStore';
const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        // Helpful indexes for sorting/searching later
        store.createIndex('by_created', 'created');
        store.createIndex('by_name', 'name');
        store.createIndex('by_type', 'type');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMedia(file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const tx = db.transaction(storeName, 'readwrite');
      const obj = {
        name: file.name,
        type: file.type || '',
        size: file.size || 0,
        created: Date.now(),
        data: reader.result, // ArrayBuffer
      };
      const addReq = tx.objectStore(storeName).add(obj);
      addReq.onsuccess = () => resolve(addReq.result); // return id
      tx.onerror = () => reject(tx.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export async function getAllMedia() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getMediaById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(Number(id));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export function arrayBufferToObjectURL(ab, type = '') {
  const blob = new Blob([ab], { type });
  return URL.createObjectURL(blob);
}

// ——— Service Worker registration ———
export function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// Small util for query param reading
export function getQueryParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
