// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)
// https://developer.chrome.com/docs/workbox/modules/workbox-sw

const CACHE = "pwabuilder-offline-page";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const offlineFallbackPage = "offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

workbox.routing.registerRoute(
  new RegExp('/assets/*.\.png'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if ( event.request.mode !== 'navigate'
    || event.request.method !== 'GET'
    || url.hostname.endsWith('run.app')
    || url.protocol === 'chrome-extension:'
    || url.pathname.match(/^\/(admin|rsvp|status|guests)/)
  ) return;

  event.respondWith((async () => {
    try {
      const preloadResp = await event.preloadResponse;

      if (preloadResp) {
        return preloadResp;
      }

      const networkResp = await fetch(event.request);
      return networkResp;
    } catch (error) {

      const cache = await caches.open(CACHE);
      const cachedResp = await cache.match(offlineFallbackPage);
      return cachedResp;
    }
  })());
});
