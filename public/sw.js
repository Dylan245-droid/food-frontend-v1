const CACHE_NAME = 'gotchop-app-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo_light.png'
]

// 1. Install Event: Cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial failure', err)
      })
    })
  )
  self.skipWaiting()
})

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// 3. Fetch Event: Network-First with Cache Fallback for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never cache API requests or SSE streams
  if (url.pathname.startsWith('/api') || url.pathname.includes('/stream') || event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful GET responses for assets & html
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      })
      .catch(async () => {
        // Offline Fallback: Serve from cache
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }

        // If navigation request (HTML), fallback to root index.html
        if (event.request.mode === 'navigate') {
          const fallbackIndex = await caches.match('/index.html')
          if (fallbackIndex) {
            return fallbackIndex
          }
        }

        return new Response('Mode hors-ligne actif. Reconnectez-vous au Wi-Fi local.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      })
  )
})

// 4. Web Push Notification
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'Nouvelle notification'
    const options = {
      body: data.body,
      icon: '/logo_light.png',
      badge: '/logo_light.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/admin/orders'
      }
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (error) {
    console.error('Error parsing push data', error)
  }
})

// 5. Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})
