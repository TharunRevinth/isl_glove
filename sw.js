// Minimal Service Worker to allow PWA Installation
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
    // Just a shell for installation
    e.respondWith(fetch(e.request));
});
