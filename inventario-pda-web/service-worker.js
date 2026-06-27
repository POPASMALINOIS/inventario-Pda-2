// service-worker.js
//
// Estrategia cache-first para el "app shell" (HTML, CSS, JS, iconos y
// manifest). Esto hace que la app cargue instantáneamente aunque el
// wifi del almacén vaya lento, y sigue siendo usable en modo lectura si
// se cae la red momentáneamente (Firestore ya tiene su propia caché
// local en IndexedDB para los datos; este SW solo cubre los archivos
// estáticos de la app en sí).

const CACHE = "inventario-pda-v1";

const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/models.js",
  "./js/utils.js",
  "./js/firebase-config.js",
  "./js/store.js",
  "./js/ui.js",
  "./js/editPanel.js",
  "./js/exportExcel.js",
  "./js/exportPdf.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Solo interceptamos peticiones GET al mismo origen (el app shell).
  // Las llamadas a Firebase, CDN de SheetJS/jsPDF, etc. van directas a
  // la red sin pasar por la caché del SW.
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        if (resp && resp.status === 200) {
          const copia = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copia));
        }
        return resp;
      });
    })
  );
});
