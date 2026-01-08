const CACHE_NAME = 'skytycoon-v67';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './css/ui.css',
    './css/components.css',
    './css/animations.css',
    './css/visuals.css',
    './assets/world_map.png',
    './js/app.js',
    './js/core/game.js',
    './js/core/db.js',
    './js/managers/uiManager.js',
    './js/managers/timeManager.js',
    './js/managers/economyManager.js',
    './js/managers/routeManager.js',
    './js/managers/fleetManager.js',
    './js/managers/rivalManager.js',
    './js/models/aircraft.js',
    './js/models/airport.js',
    './js/models/progressionModel.js',
    './js/story/storyManager.js',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    self.skipWaiting(); // Force activation
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request);
        })
    );
});
