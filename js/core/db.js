/**
 * IndexedDB Wrapper
 */
export const DB = {
    dbName: 'SkyTycoonDB',
    version: 1,
    db: null,

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (e) => reject("DB Error: " + e.target.error);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('gameState')) {
                    db.createObjectStore('gameState', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
        });
    },

    async saveState(state) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['gameState'], 'readwrite');
            const store = tx.objectStore('gameState');
            // ID 1 is the main save slot for now
            const req = store.put({ id: 1, ...state });

            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    async loadState() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['gameState'], 'readonly');
            const store = tx.objectStore('gameState');
            const req = store.get(1);

            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async hasSave() {
        const data = await this.loadState();
        return !!data;
    }
};
