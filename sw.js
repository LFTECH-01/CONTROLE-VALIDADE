const CACHE_NAME = 'web-validade-v4'; // Incrementado para v4crementado para forçar atualização
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './firebase-config.js',
  './manifest.json',
  './logo192x192.png',
  './logo512x512.png'
];

// Instalação: Salva os arquivos essenciais no cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto e arquivos mapeados');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Busca (Fetch): Tenta a rede primeiro, se falhar (offline), usa o cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
