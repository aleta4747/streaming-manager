const CACHE_NAME = 'streaming-aletag8-v1';
const FILES = [
  '/streaming-manager/streaming-manager.html',
  '/streaming-manager/manifest.json',
  '/streaming-manager/icon.png'
];

// Instalar: cachear todos los archivos
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: servir desde cache, actualizar en background
self.addEventListener('fetch', function(e) {
  // Solo cachear archivos propios, no APIs externas
  var url = e.request.url;
  if (url.includes('googleapis.com') ||
      url.includes('accounts.google.com') ||
      url.includes('gsi/client') ||
      url.includes('apis.google.com')) {
    return; // dejar pasar sin cache
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var networkFetch = fetch(e.request).then(function(response) {
        // Actualizar cache con versión nueva
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() { return cached; });

      // Servir desde cache inmediatamente, actualizar en background
      return cached || networkFetch;
    })
  );
});
