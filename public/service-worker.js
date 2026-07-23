const CACHE_NAME = 'arcpay-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Only intercept simple GET requests for the app's own files (HTML/CSS/JS/images).
  // POST requests - like blockchain RPC calls - must never be caught here:
  // caches.match() can never match a POST request, so it returns undefined,
  // and respondWith(undefined) breaks the request with a "not a Response"
  // error instead of failing cleanly. That silent breakage was making RPC
  // calls fail across the whole app whenever the network had any hiccup.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'SparkPay', {
      body: data.body || '',
      icon: '/logo192.png'
    })
  );
});
