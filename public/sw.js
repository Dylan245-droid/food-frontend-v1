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

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        // If so, just focus it.
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})
