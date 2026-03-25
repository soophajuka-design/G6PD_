
// service-worker.js

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('g6pd-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.js',
        '/libs/opencv.js',
        '/libs/tf.min.js',
        '/model/model.json'
      ]);
    })
  );
});
