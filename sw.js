// Academic Skill Tree - PWA Service Worker
const CACHE_NAME = 'ast-cache-v1.4.1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon.png',
    './icon-192.png',
    './icon-512.png',
    './apple-touch-icon.png',
    './faculty_logo_cyan.png',
    './user_saved_state.json'
];

// Install: Cache core application assets and activate immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching static assets for offline use');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: Clean up old cache versions and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network-first for application code (HTML, JS, CSS) to ensure instant updates; Cache-first for images
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip caching for Google Scripts, Moodle API, or chrome extensions
    if (url.hostname.includes('google.com') || url.hostname.includes('technion.ac.il') || url.protocol.startsWith('chrome-extension')) {
        return;
    }

    const isAppCode = event.request.mode === 'navigate' || 
                      url.pathname.endsWith('.html') || 
                      url.pathname.endsWith('.js') || 
                      url.pathname.endsWith('.css') || 
                      url.pathname.endsWith('user_saved_state.json');

    if (isAppCode) {
        // Network-First strategy: always fetch freshest version online, fallback to cache offline
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
        );
        return;
    }

// Cache-first for images, fonts, and icons
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});

// Notification Click Handler: Deep-link to Timetable or Tasks view
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const tag = event.notification.tag;
    const action = event.action;
    let targetTab = 'curriculum';

    if (tag === 'ast-today-lectures' || (tag && tag.startsWith('ast-reminder-')) || action === 'open-timetable') {
        targetTab = 'timetable';
    } else if (tag === 'ast-upcoming-tasks' || action === 'open-tasks') {
        targetTab = 'tasks';
    }

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.postMessage({ type: 'NAVIGATE_TAB', tab: targetTab });
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow('./?tab=' + targetTab);
            }
        })
    );
});
