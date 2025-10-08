const CACHE_NAME = 'duel-log-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  // '/src/main.ts', // This path does not exist in the built output
  // '/src/style.css', // This path does not exist in the built output
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // addAll can fail if any of the files are not found. 
        // It's better to handle potential failures gracefully.
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Failed to cache urls:', err);
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
