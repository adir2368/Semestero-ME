// Service Worker for Academic Skill Tree (Semestero ME) - v1.9.6
const CACHE_NAME = 'semestero-me-v1.9.6';

const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './cheesefork_database.js',
    './cheesefork_courses.min.js',
    './curriculum_template.js',
    './planner_catalog.js',
    './planner_module.js',
    './technion_academic_calendar.js',
    './auth_sync.js',
    './moodle_sync.js',
    './app.js',
    './manifest.json',
    './icon.png',
    './icon-192.png',
    './icon-512.png',
    './apple-touch-icon.png',
    './faculty_logo_cyan.png',
    './adir_avatar.png',
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

    // Never intercept or cache external APIs (Supabase, Google, Technion, etc.)
    if (url.origin !== self.location.origin || url.hostname.includes('supabase.co') || url.hostname.includes('google.com') || url.hostname.includes('technion.ac.il') || url.protocol.startsWith('chrome-extension')) {
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

// Push Notification Handler: Process background web push messages
self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Semestero ME', body: event.data.text() };
        }
    }
    const title = data.title || '🔔 תזכורת שיעור אקדמי';
    const options = {
        body: data.body || 'יש לך אירוע קרוב במערכת השעות',
        icon: 'icon.png',
        badge: 'icon.png',
        tag: data.tag || 'ast-push-reminder',
        renotify: true,
        vibrate: [250, 100, 250, 100, 250],
        data: data.data || { tab: 'timetable' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Periodic Background Sync Handler
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-class-reminders') {
        console.log('[SW] Running periodic background sync for class reminders');
    }
});

