const CACHE_NAME = 'tantara-v2'
const SHELL_URL = '/'
const FONT_URLS = [
    '/fonts/fredoka-500.woff2',
    '/fonts/fredoka-600.woff2',
    '/fonts/fredoka-700.woff2',
    '/fonts/nunito-500.woff2',
    '/fonts/nunito-700.woff2',
    '/fonts/nunito-800.woff2',
]

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.add(SHELL_URL).then(() => cache.addAll(FONT_URLS))).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim()),
    )
})

const showLatestNotification = async () => {
    let content = { title: 'Tantara', body: '' }
    try {
        const response = await fetch('/api/notifications/latest', { credentials: 'same-origin' })
        if (response.ok) {
            content = await response.json()
        }
    } catch (_error) {
        content = { title: 'Tantara', body: '' }
    }
    await self.registration.showNotification(content.title, { body: content.body, icon: '/icon-192.png', badge: '/favicon-32.png', tag: 'tantara' })
}

self.addEventListener('push', event => {
    event.waitUntil(showLatestNotification())
})

self.addEventListener('notificationclick', event => {
    event.notification.close()
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
            const open = windows.find(client => 'focus' in client)
            return open ? open.focus() : self.clients.openWindow('/notifications')
        }),
    )
})

self.addEventListener('fetch', event => {
    const request = event.request
    const url = new URL(request.url)
    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return
    }
    if (url.pathname.startsWith('/_nuxt/') || url.pathname.startsWith('/fonts/')) {
        event.respondWith(
            caches.match(request).then(
                cached =>
                    cached ||
                    fetch(request).then(response => {
                        const copy = response.clone()
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
                        return response
                    }),
            ),
        )
        return
    }
    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(SHELL_URL)))
    }
})
