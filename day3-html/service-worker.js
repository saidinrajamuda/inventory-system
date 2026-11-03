// ===== SERVICE WORKER - PWA OFFLINE SUPPORT =====

const CACHE_NAME = "inventory-cache-v1";

const FILES_TO_CACHE = [
    "./", "./login.html", "./register.html", "./dashboard.html",
    "./index.html", "./scan.html", "./reports.html", "./users.html",
    "./issue.html", "./discrepancies.html",
    "./style.css", "./config.js", "./auth.js",
    "./login.js", "./register.js", "./dashboard.js", "./script.js",
    "./scan.js", "./reports.js", "./users.js", "./issue.js", "./discrepancies.js"
];

self.addEventListener("install", (event) => {
    console.log("🔧 Service Worker: Installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE).catch(() => {}))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("✅ Service Worker: Activated!");
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : null)
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = event.request.url;

    // Skip API calls (palaging kukuha ng fresh data)
    if (url.includes("/api/")) {
        event.respondWith(fetch(event.request).catch(() => 
            new Response(JSON.stringify({ success: false, message: "⚠️ Offline" }), 
            { headers: { "Content-Type": "application/json" } })
        ));
        return;
    }

    // Cache-first for everything else (HTML, CSS, JS)
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                fetch(event.request).then((res) => {
                    if (res && res.status === 200) {
                        caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
                    }
                }).catch(() => {});
                return cached;
            }
            return fetch(event.request).catch(() => caches.match("./login.html"));
        })
    );
});