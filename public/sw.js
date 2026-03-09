const CACHE_NAME = "concretiza-v1"
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
]

// ── Instalação: pré-cache dos assets estáticos ────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Ativação: limpar caches antigos ─────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first para API, cache-first para estáticos ────────────
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requisições não-GET e cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return

  // API e tRPC → sempre rede (sem cache)
  if (url.pathname.startsWith("/api/")) return

  // Páginas e assets → network-first com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Armazena resposta bem-sucedida no cache
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached ?? caches.match("/offline.html")
        )
      )
  )
})

// ── Push notifications ───────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    "/icons/icon-192.png",
      badge:   "/icons/icon-192.png",
      data:    { url: data.url ?? "/" },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/"
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
