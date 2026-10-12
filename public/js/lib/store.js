// Local storage for cases and photos. Everything stays on this device.
// Uses IndexedDB; falls back to memory (with a warning) when the browser blocks storage.

const DB_NAME = 'curbcut';
const DB_VERSION = 1;

let dbPromise = null;
let memory = null; // { cases: Map, photos: Map } when IndexedDB is unavailable
const listeners = new Set();

export function onStoreChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) {
    try { fn(); } catch (e) { console.error(e); }
  }
}

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cases')) db.createObjectStore('cases', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' });
        s.createIndex('caseId', 'caseId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  }).then((db) => {
    if (!db) memory = { cases: new Map(), photos: new Map() };
    return db;
  });
  return dbPromise;
}

export async function isSaving() {
  const db = await open();
  return !!db;
}

function tx(db, stores, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let result;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
    result = fn(t);
  });
}

function reqP(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

export function newId(prefix = 'c') {
  const rand = (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g, '');
  return `${prefix}_${rand.slice(0, 16)}`;
}

export async function getCase(id) {
  const db = await open();
  if (!db) return memory.cases.has(id) ? clone(memory.cases.get(id)) : null;
  const t = db.transaction('cases', 'readonly');
  return (await reqP(t.objectStore('cases').get(id))) || null;
}

export async function listCases() {
  const db = await open();
  let all;
  if (!db) all = [...memory.cases.values()].map(clone);
  else {
    const t = db.transaction('cases', 'readonly');
    all = await reqP(t.objectStore('cases').getAll());
  }
  return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function putCase(c) {
  const record = { ...c, updatedAt: new Date().toISOString() };
  const db = await open();
  if (!db) memory.cases.set(record.id, clone(record));
  else await tx(db, ['cases'], 'readwrite', (t) => t.objectStore('cases').put(record));
  emit();
  return record;
}

export async function deleteCase(id) {
  const db = await open();
  if (!db) {
    memory.cases.delete(id);
    for (const [pid, p] of memory.photos) if (p.caseId === id) memory.photos.delete(pid);
  } else {
    const photos = await listPhotos(id);
    await tx(db, ['cases', 'photos'], 'readwrite', (t) => {
      t.objectStore('cases').delete(id);
      for (const p of photos) t.objectStore('photos').delete(p.id);
    });
  }
  emit();
}

export async function putPhoto(photo) {
  const db = await open();
  if (!db) {
    memory.photos.set(photo.id, photo);
    return photo;
  }
  await tx(db, ['photos'], 'readwrite', (t) => t.objectStore('photos').put(photo));
  return photo;
}

export async function getPhoto(id) {
  const db = await open();
  if (!db) return memory.photos.get(id) || null;
  const t = db.transaction('photos', 'readonly');
  return (await reqP(t.objectStore('photos').get(id))) || null;
}

export async function listPhotos(caseId) {
  const db = await open();
  if (!db) return [...memory.photos.values()].filter((p) => p.caseId === caseId);
  const t = db.transaction('photos', 'readonly');
  return reqP(t.objectStore('photos').index('caseId').getAll(caseId));
}

export async function deletePhoto(id) {
  const db = await open();
  if (!db) {
    memory.photos.delete(id);
    return;
  }
  await tx(db, ['photos'], 'readwrite', (t) => t.objectStore('photos').delete(id));
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// Decoded by hand so it works under the app's strict Content-Security-Policy (no fetch of data: URLs).
function dataURLToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const head = dataUrl.slice(0, comma);
  const mime = /^data:([^;,]+)/.exec(head)?.[1] || 'application/octet-stream';
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// A single JSON file with every case and photo. Photos are embedded as data URLs.
export async function exportAll() {
  const cases = await listCases();
  const photos = [];
  for (const c of cases) {
    for (const p of await listPhotos(c.id)) {
      const { blob, ...rest } = p;
      photos.push({ ...rest, dataUrl: blob instanceof Blob ? await blobToDataURL(blob) : p.dataUrl || null });
    }
  }
  return { format: 'curbcut-backup', version: 1, exportedAt: new Date().toISOString(), cases, photos };
}

// Adds cases from a backup. A case already on this device is replaced only if the backup copy is newer.
export async function importAll(data) {
  if (!data || data.format !== 'curbcut-backup' || !Array.isArray(data.cases)) {
    throw new Error('This file is not a CurbCutter backup.');
  }
  const existing = new Map((await listCases()).map((c) => [c.id, c]));
  let added = 0;
  let updated = 0;
  for (const c of data.cases) {
    if (!c || typeof c.id !== 'string') continue;
    const mine = existing.get(c.id);
    if (mine && mine.updatedAt >= c.updatedAt) continue;
    const db = await open();
    if (!db) memory.cases.set(c.id, clone(c));
    else await tx(db, ['cases'], 'readwrite', (t) => t.objectStore('cases').put(c));
    if (mine) updated += 1; else added += 1;
  }
  for (const p of data.photos || []) {
    if (!p || typeof p.id !== 'string' || !p.dataUrl) continue;
    const blob = dataURLToBlob(p.dataUrl);
    const { dataUrl, ...rest } = p;
    await putPhoto({ ...rest, blob });
  }
  emit();
  return { added, updated };
}

export async function clearAll() {
  const db = await open();
  if (!db) {
    memory.cases.clear();
    memory.photos.clear();
  } else {
    await tx(db, ['cases', 'photos'], 'readwrite', (t) => {
      t.objectStore('cases').clear();
      t.objectStore('photos').clear();
    });
  }
  emit();
}

// Ask the browser to keep our data even when the device is low on space.
// Granted more often when CurbCutter is installed to the Home Screen.
export async function requestPersistence() {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch (e) {
    /* not supported */
  }
  return false;
}
