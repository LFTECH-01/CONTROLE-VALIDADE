const CACHE_NAME = 'web-validade-v2'; // Mudar o v1 para v2 força o navegador a atualizar

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força o novo Service Worker a assumir o controle imediatamente
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
