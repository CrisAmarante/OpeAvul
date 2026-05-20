const CACHE_NAME = 'penso-ocorrencias-v1.0.0';

// Lista de arquivos essenciais para cache (apenas os necessários)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './utils.js',
  './api.js',
  './auth.js',
  './ocorrencia.js',
  './main.js',
  './manifest.json',
  './icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Instalação: cache dos assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache da PWA de Ocorrências instalado');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Stale-While-Revalidate + cache para thumbnails do Drive
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para a API (Google Apps Script)
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // Cache específico para thumbnails do Google Drive
  if (event.request.url.includes('drive.google.com/thumbnail')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Placeholder offline
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="#999"><path d="M4 4h16v16H4z"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Demais assets: Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {});
        return response || fetchPromise;
      });
    })
  );
});
