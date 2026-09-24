// Soda El Tucán POS — trabajador sin conexión
// Guarda una copia del sistema en la compu para que abra y funcione aunque no haya internet.
// Con internet: siempre carga la versión más nueva de GitHub (y actualiza la copia).
// Sin internet (o internet muy lento): abre la copia guardada.
const CACHE = 'tucan-pos-v1';
const PAGINAS = ['restaurante_pos_v2.html', 'tablet_prueba.html', 'inicio.html'];

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    const cache = await caches.open(CACHE);
    await Promise.all(PAGINAS.map(async function (p) {
      try {
        const url = new URL(p, self.registration.scope);
        const r = await fetch(url.href, { cache: 'no-store' });
        if (r && r.ok) await cache.put(url.origin + url.pathname, r);
      } catch (err) { /* si una página no existe, se ignora */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ntfy.sh y otros servicios no se tocan
  const clave = url.origin + url.pathname;          // ignora ?tablet=1&topic=...
  e.respondWith((async function () {
    const cache = await caches.open(CACHE);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(function () { ctrl.abort(); }, 5000);
      const r = await fetch(req.url, { signal: ctrl.signal, cache: 'no-store', credentials: 'same-origin' });
      clearTimeout(t);
      if (r && r.ok) cache.put(clave, r.clone());
      return r;
    } catch (err) {
      const copia = await cache.match(clave);
      if (copia) return copia;
      throw err;
    }
  })());
});
