// Service Worker لضمان استيفاء شروط PWA وتفعيل ميزة التثبيت
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // مطلوب لمتصفح كروم لتفعيل زر التثبيت الرسمي
  event.respondWith(fetch(event.request));
});