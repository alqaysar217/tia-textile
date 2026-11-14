self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // الحد الأدنى المطلوب لتفعيل خيار التثبيت في المتصفح
  event.respondWith(fetch(event.request));
});