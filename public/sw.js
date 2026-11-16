// عامل خدمة بسيط جداً لتلبية شروط التثبيت (PWA) دون التداخل مع قاعدة البيانات
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // لا نقوم بأي اعتراض للطلبات هنا لضمان عمل Firestore بشكل سليم
  return;
});
