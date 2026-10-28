/* ئامادەبوون — بەشی کاری کۆمەڵایەتی · سێرڤیس وۆرکەر
   پێکهاتەی ئەپ کاش دەکرێت تا خێرا بکرێتەوە و بەبێ ئینتەرنێتیش کار بکات.
   داواکاری API هەرگیز کاش ناکرێت: ئەو ئامادەبوونەی نەنێردراوە لەلایەن
   لاپەڕەکەوە لە localStorage ڕیز دەکرێت و کاتێک پەیوەندی گەڕایەوە دەنێردرێت. */

const CACHE = 'uor-sw-att-v1';
const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // هەرگیز دەست لە API نادات
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // فۆنت و CDN و API تێپەڕ دەکات

  /* گەڕان بۆ لاپەڕە: سەرەتا تۆڕ، ئەگەر نەبوو پێکهاتەی کاشکراو */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* فایلەکان: سەرەتا کاش، لە پشتەوە نوێ دەکرێتەوە */
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
