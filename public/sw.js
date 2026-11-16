// Passive Service Worker for TIA Production System
// This version enables PWA installation but DOES NOT intercept network requests
// to prevent conflicts with Firestore long-polling and WebChannel.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch listener is empty to satisfy PWA requirements while remaining passive
self.addEventListener('fetch', (event) => {
  // Do nothing, let the browser handle requests naturally
  return;
});
