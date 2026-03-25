
// service-worker.js

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open('g6pd').then(c=>c.addAll(['/']))
  );
});