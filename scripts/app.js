// db.js (renamed from app.js for clarity)
export const dbName = 'zuraMediaDB';
export const storeName = 'mediaStore';
const DB_VERSION = 1;

// Open IndexedDB
export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_created', 'created');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save media
export async function saveMedia(file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const obj = {
        name: file.name,
        type: file.type || '',
        size: file.size || 0,
        created: Date.now(),
        data: reader.result
      };
      const req = store.add(obj);
      req.onsuccess = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Get all media
export async function getAllMedia() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Get media by ID
export async function getMediaById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(Number(id));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Delete media
export async function deleteMedia(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(Number(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Clear library
export async function clearLibrary() {
  if (!confirm('Are you sure you want to clear the library?')) return;
  if (!confirm('This action is permanent. Clear library now?')) return;
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  await new Promise(res => (tx.oncomplete = res));
}

// Convert ArrayBuffer to object URL
export function arrayBufferToObjectURL(ab, type = '') {
  const blob = new Blob([ab], { type });
  return URL.createObjectURL(blob);
}

// Service Worker registration
export function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
