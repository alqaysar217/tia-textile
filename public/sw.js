// Service Worker لضمان استيفاء شروط PWA وتفعيل ميزة التثبيت
const CACHE_NAME = 'nseeg-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // الحد الأدنى المطلوب لعمل الـ Service Worker
  event.respondWith(fetch(event.request).catch(() => {
    return caches.match(event.request);
  }));
});