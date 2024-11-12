const CACHE_NAME = 'healthcare-app-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/utils.js',
    '/storage.js',
    '/state.js',
    '/tripManagement.js',
    '/leadManagement.js',
    '/visualizationTools.js',
    '/trackingTools.js',
    '/exportImportTools.js',
    '/init.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
}); 