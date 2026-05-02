/**
 * offline.service.js
 * Servicio de almacenamiento offline usando IndexedDB nativo del navegador.
 *
 * Permite encolar registros de asistencia cuando no hay red,
 * y sincronizarlos con el backend cuando la conexión se restaura.
 *
 * DB: faceAttendDB  v1
 * Stores:
 *   - pending_attendances  { student_id, student_name, subject_id, laboratory_id,
 *                            confidence_score, check_in_time, synced }
 */

const DB_NAME    = 'faceAttendDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_attendances';

// ─── Abrir / crear la base de datos ───────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'localId',
                    autoIncrement: true,
                });
                store.createIndex('synced',       'synced',       { unique: false });
                store.createIndex('check_in_time','check_in_time',{ unique: false });
                console.info('[OfflineDB] Store creado:', STORE_NAME);
            }
        };

        request.onsuccess  = (e) => resolve(e.target.result);
        request.onerror    = (e) => reject(e.target.error);
    });
}

// ─── Encolar una asistencia para sincronizar después ──────────────
async function queueAttendance({ student_id, student_name, subject_id, laboratory_id, confidence_score }) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx    = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record = {
            student_id,
            student_name:     student_name || 'Desconocido',
            subject_id,
            laboratory_id,
            confidence_score: confidence_score ?? 0,
            check_in_time:    new Date().toISOString(),
            synced:           false,
        };
        const req = store.add(record);
        req.onsuccess = (e) => {
            console.info('[OfflineDB] Asistencia encolada. localId:', e.target.result);
            resolve({ ...record, localId: e.target.result });
        };
        req.onerror = (e) => reject(e.target.error);
    });
}

// ─── Obtener todas las asistencias pendientes de sincronizar ──────
async function getPendingAttendances() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx    = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('synced');
        const req   = index.getAll(false); // false = no sincronizadas
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror   = (e) => reject(e.target.error);
    });
}

// ─── Obtener conteo de pendientes (para badge en UI) ──────────────
async function getPendingCount() {
    const pending = await getPendingAttendances();
    return pending.length;
}

// ─── Marcar un registro como sincronizado ─────────────────────────
async function markAsSynced(localId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx    = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(localId);
        getReq.onsuccess = (e) => {
            const record = e.target.result;
            if (!record) return resolve(false);
            record.synced = true;
            const putReq = store.put(record);
            putReq.onsuccess = () => resolve(true);
            putReq.onerror   = (err) => reject(err.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
    });
}

// ─── Eliminar registros ya sincronizados ──────────────────────────
async function clearSynced() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx    = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('synced');
        const req   = index.openCursor(IDBKeyRange.only(true));
        let deleted = 0;
        req.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                cursor.delete();
                deleted++;
                cursor.continue();
            } else {
                console.info(`[OfflineDB] ${deleted} registros sincronizados eliminados.`);
                resolve(deleted);
            }
        };
        req.onerror = (e) => reject(e.target.error);
    });
}

// ─── Sincronizar con el backend ───────────────────────────────────
/**
 * Envía todos los registros pendientes al backend vía POST /api/attendance/sync-offline.
 * Retorna { synced: n, failed: n }.
 */
async function syncWithBackend() {
    const pending = await getPendingAttendances();
    if (pending.length === 0) {
        return { synced: 0, failed: 0 };
    }

    const token = localStorage.getItem('token');
    const results = { synced: 0, failed: 0 };

    for (const record of pending) {
        try {
            const res = await fetch('/api/attendance/sync-offline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    student_id:       record.student_id,
                    subject_id:       record.subject_id,
                    laboratory_id:    record.laboratory_id,
                    confidence_score: record.confidence_score,
                    check_in_time:    record.check_in_time,
                }),
            });

            if (res.ok) {
                await markAsSynced(record.localId);
                results.synced++;
            } else {
                results.failed++;
            }
        } catch {
            results.failed++;
        }
    }

    // Limpiar los ya sincronizados de IndexedDB
    if (results.synced > 0) await clearSynced();

    console.info(`[OfflineDB] Sync: ${results.synced} ok, ${results.failed} fallidos`);
    return results;
}

// ─── Obtener todos los registros (para debug/UI) ──────────────────
async function getAllAttendances() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx    = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req   = store.getAll();
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror   = (e) => reject(e.target.error);
    });
}

const offlineService = {
    queueAttendance,
    getPendingAttendances,
    getPendingCount,
    markAsSynced,
    clearSynced,
    syncWithBackend,
    getAllAttendances,
};

export default offlineService;
