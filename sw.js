/* Service worker — deixa o app rápido e abrindo mesmo sem internet.
   Ao publicar uma nova versão, aumente o número abaixo. */
const VERSAO = "cv-diretoria-v5";
const ARQUIVOS = ["./", "index.html", "style.css", "config.js", "demo.js", "app.js", "manifest.webmanifest",
  "logo.svg", "logo-branco.svg", "marca.svg", "icon-192.png", "apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                       // chamadas à API (POST) nunca passam pelo cache
  if (new URL(req.url).hostname.includes("google.com")) return;
  e.respondWith(caches.match(req).then(cache => {
    const rede = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); } return r; }).catch(() => cache);
    return cache || rede;                                   // abre na hora e atualiza em segundo plano
  }));
});
