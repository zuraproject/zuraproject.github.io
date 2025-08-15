export const dbName = 'zuraMediaDB';
export const storeName = 'mediaStore';

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMedia(file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).add({
        name: file.name,
        type: file.type,
        data: reader.result
      });
      tx.oncomplete = resolve;
      tx.onerror = reject;
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function getAllMedia() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    tx.objectStore(storeName).getAll().onsuccess = (e) => resolve(e.target.result);
  });
}
