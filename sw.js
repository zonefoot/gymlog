const CACHE_NAME = 'gymlog-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Cache first, fallback to network
self.addEventListener('fetch', event => {
  // Pour les requêtes GET
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            // Ne pas cacher les réponses non-200
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone la réponse
            const responseToCache = response.clone();
            
            // Ajoute au cache si possible
            if (event.request.url.includes('cdnjs') || 
                event.request.url.includes('chart') ||
                event.request.url.startsWith(self.location.origin)) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            
            return response;
          });
        })
        .catch(() => {
          // Fallback pour les assets offline
          return caches.match('/');
        })
    );
  }
});
